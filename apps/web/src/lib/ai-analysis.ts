import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client - uses ANTHROPIC_API_KEY env var by default
const anthropic = new Anthropic();

export type DocumentationQuality = "COMPLETE" | "PARTIAL" | "INSUFFICIENT";
export type IntentAlignment = "ALIGNED" | "UNCLEAR" | "MISALIGNED";
export type AuditReadiness = "READY" | "NEEDS_WORK" | "NOT_READY";

export interface DocumentationAnalysis {
  documentationQuality: DocumentationQuality;
  intentAlignment: IntentAlignment;
  auditReadiness: AuditReadiness;
  summary: string;
  missingContext: string[];
  suggestions: string[];
}

export interface IntentMatch {
  matches: boolean;
  confidence: number;
  concerns: string[];
}

export interface AuditSummary {
  summary: string;
  keyChanges: string[];
  auditReadiness: AuditReadiness;
}

interface DERForAudit {
  prTitle: string;
  prAuthor: string;
  description: string | null;
  ticketLinks: string[];
  slackThreads: string[];
  evidenceScore: number;
  reviews: Array<{
    author: string;
    state: string;
    body: string | null;
  }>;
  gaps: Array<{
    type: string;
    message: string;
    resolved: boolean;
  }>;
  createdAt: Date;
}

/**
 * Analyze the documentation completeness of a pull request using Claude
 * Focuses on decision evidence for SOC 2/SOX compliance audits
 * Uses claude-3-haiku for speed/cost efficiency
 */
export async function analyzeChangeRisk(
  prTitle: string,
  prDescription: string | null,
  filesChanged: string[],
  diff: string | null
): Promise<DocumentationAnalysis> {
  // Return default if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("[AI Analysis] No API key configured, using rule-based fallback");
    return getRuleBasedDocumentationAnalysis(prTitle, prDescription, filesChanged);
  }

  try {
    const filesContext = filesChanged.length > 0
      ? `Files Changed (${filesChanged.length} total):\n${filesChanged.slice(0, 30).join("\n")}${filesChanged.length > 30 ? `\n... and ${filesChanged.length - 30} more` : ""}`
      : "No file list available";

    const diffContext = diff
      ? `\nCode Diff:\n\`\`\`\n${diff.substring(0, 6000)}${diff.length > 6000 ? "\n... (truncated)" : ""}\n\`\`\``
      : "";

    const prompt = `You are analyzing a pull request for documentation completeness. This is for a SOC 2/SOX compliance system that helps auditors understand WHY changes were made.

**Your goal is NOT to find security vulnerabilities.** Your goal is to assess whether this change is properly documented for audit purposes.

**PR Title:** ${prTitle}

**PR Description:**
${prDescription || "(No description provided)"}

**${filesContext}**
${diffContext}

**Evaluate the following:**

1. **Purpose Documentation**: Is the purpose of this change clearly documented?
   - Does the PR description explain WHAT is being changed?
   - Does it explain WHY this change is needed?
   - Is there enough context for someone unfamiliar with the code?

2. **Intent Alignment**: Do the code changes align with the stated intent?
   - Does the scope of changes match what the description says?
   - Are there unexplained changes that weren't mentioned?
   - Is there scope creep (extra changes beyond stated purpose)?

3. **Audit Readiness**: Is there sufficient context for an auditor to understand this change?
   - Would an auditor be able to understand the business justification?
   - Is there a clear trail of who approved and why?
   - Are there references to tickets, requirements, or discussions?

**Respond with this exact JSON format:**
{
  "documentationQuality": "COMPLETE" | "PARTIAL" | "INSUFFICIENT",
  "intentAlignment": "ALIGNED" | "UNCLEAR" | "MISALIGNED",
  "auditReadiness": "READY" | "NEEDS_WORK" | "NOT_READY",
  "summary": "A 2-3 sentence audit-ready summary of what this change does and why it was made. Write in third person, past tense.",
  "missingContext": ["specific missing context 1", "specific missing context 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"]
}

**Documentation Quality Guidelines:**
- **COMPLETE**: Clear description of what and why, scope matches changes, references to requirements/tickets
- **PARTIAL**: Some explanation but missing key details (why it's needed, business context, scope gaps)
- **INSUFFICIENT**: No meaningful description, unclear purpose, or significant undocumented changes

**Intent Alignment Guidelines:**
- **ALIGNED**: Code changes match the stated purpose, no unexplained modifications
- **UNCLEAR**: Description is vague or changes are hard to verify against intent
- **MISALIGNED**: Obvious mismatch between description and actual changes, scope creep

**Audit Readiness Guidelines:**
- **READY**: An auditor could understand the business justification and approval chain
- **NEEDS_WORK**: Missing some context but the core change is understandable
- **NOT_READY**: Auditor would have significant questions about why this change was made

Focus on documentation quality, not code quality. Be helpful, not judgmental.`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as DocumentationAnalysis;

    // Validate and set defaults
    if (!["COMPLETE", "PARTIAL", "INSUFFICIENT"].includes(result.documentationQuality)) {
      result.documentationQuality = "PARTIAL";
    }
    if (!["ALIGNED", "UNCLEAR", "MISALIGNED"].includes(result.intentAlignment)) {
      result.intentAlignment = "UNCLEAR";
    }
    if (!["READY", "NEEDS_WORK", "NOT_READY"].includes(result.auditReadiness)) {
      result.auditReadiness = "NEEDS_WORK";
    }
    if (!Array.isArray(result.missingContext)) {
      result.missingContext = [];
    }
    if (!Array.isArray(result.suggestions)) {
      result.suggestions = [];
    }
    if (!result.summary) {
      result.summary = `${prTitle} was submitted for review.`;
    }

    console.log(`[AI Analysis] Documentation analysis complete: quality=${result.documentationQuality}, intent=${result.intentAlignment}, audit=${result.auditReadiness}`);
    return result;
  } catch (error) {
    console.error("[AI Analysis] Error analyzing documentation:", error);
    return getRuleBasedDocumentationAnalysis(prTitle, prDescription, filesChanged);
  }
}

/**
 * Generate a human-readable audit summary for a DER
 * Uses claude-sonnet for detailed analysis
 */
export async function generateAuditSummary(der: DERForAudit): Promise<AuditSummary> {
  // Return default if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("[AI Analysis] No API key configured, using rule-based fallback");
    return getRuleBasedAuditSummary(der);
  }

  try {
    const reviewSummary = der.reviews.length > 0
      ? der.reviews.map(r => `- ${r.author}: ${r.state}${r.body ? ` - "${r.body.substring(0, 100)}"` : ""}`).join("\n")
      : "No reviews yet";

    const gapSummary = der.gaps.filter(g => !g.resolved).length > 0
      ? der.gaps.filter(g => !g.resolved).map(g => `- ${g.message}`).join("\n")
      : "No unresolved gaps";

    const prompt = `Generate a concise audit summary for this code change. This will be used for SOC 2/SOX compliance documentation.

PR Title: ${der.prTitle}
Author: ${der.prAuthor}
Created: ${der.createdAt.toISOString()}
Evidence Score: ${der.evidenceScore}/100

Description:
${der.description || "(No description)"}

Linked Tickets: ${der.ticketLinks.length > 0 ? der.ticketLinks.join(", ") : "None"}
Slack Threads: ${der.slackThreads.length > 0 ? der.slackThreads.length + " linked" : "None"}

Reviews:
${reviewSummary}

Outstanding Documentation Gaps:
${gapSummary}

Respond with a JSON object:
{
  "summary": "A 2-3 sentence audit summary explaining what changed, why, and who was involved. Write in past tense as if documenting a completed change for an auditor.",
  "keyChanges": ["change 1", "change 2", "change 3"],
  "auditReadiness": "READY" | "NEEDS_WORK" | "NOT_READY"
}

**Audit Readiness Guidelines:**
- **READY**: Well-documented change with clear justification and approval trail
- **NEEDS_WORK**: Some documentation exists but gaps remain
- **NOT_READY**: Insufficient documentation for audit purposes

The summary should answer: What changed? Why? Who approved it?`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as AuditSummary;

    if (!["READY", "NEEDS_WORK", "NOT_READY"].includes(result.auditReadiness)) {
      result.auditReadiness = "NEEDS_WORK";
    }

    console.log("[AI Analysis] Audit summary generated");
    return result;
  } catch (error) {
    console.error("[AI Analysis] Error generating audit summary:", error);
    return getRuleBasedAuditSummary(der);
  }
}

/**
 * Check if code changes align with the stated intent
 * Uses claude-3-haiku for efficiency
 */
export async function checkCodeMatchesIntent(
  prDescription: string | null,
  ticketDescription: string | null,
  diff: string | null
): Promise<IntentMatch> {
  // Return default if no API key or missing context
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("[AI Analysis] No API key configured, using rule-based fallback");
    return { matches: true, confidence: 0.5, concerns: ["AI analysis not available"] };
  }

  if (!prDescription && !ticketDescription) {
    return {
      matches: false,
      confidence: 0.9,
      concerns: ["No description or ticket provided to verify intent"],
    };
  }

  if (!diff) {
    return {
      matches: true,
      confidence: 0.3,
      concerns: ["No diff available to verify code matches intent"],
    };
  }

  try {
    const prompt = `Analyze if the code changes match the stated intent. This is for audit documentation purposes.

Stated Intent (PR Description):
${prDescription || "(No PR description)"}

${ticketDescription ? `Ticket Description:\n${ticketDescription}` : ""}

Code Changes (diff):
${diff.substring(0, 6000)}${diff.length > 6000 ? "\n... (truncated)" : ""}

Check for documentation issues like:
- Scope creep (changes beyond stated intent)
- Missing changes mentioned in description
- Undocumented modifications
- Mismatch between stated purpose and actual changes

Respond with JSON:
{
  "matches": true | false,
  "confidence": 0.0 to 1.0,
  "concerns": ["concern 1", "concern 2"] // empty if no concerns
}

Focus on whether the documentation accurately describes the changes, not on code quality.`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as IntentMatch;

    // Clamp confidence
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    console.log(`[AI Analysis] Intent match: ${result.matches} (${result.confidence})`);
    return result;
  } catch (error) {
    console.error("[AI Analysis] Error checking intent match:", error);
    return { matches: true, confidence: 0.5, concerns: ["AI analysis failed"] };
  }
}

// Fallback rule-based analysis when API is unavailable

function getRuleBasedDocumentationAnalysis(
  prTitle: string,
  prDescription: string | null,
  filesChanged: string[]
): DocumentationAnalysis {
  const missingContext: string[] = [];
  const suggestions: string[] = [];
  let docScore = 0;

  // Check description quality
  if (!prDescription) {
    missingContext.push("No PR description provided");
    suggestions.push("Add a description explaining what changed and why");
    docScore -= 30;
  } else if (prDescription.length < 50) {
    missingContext.push("PR description is too brief");
    suggestions.push("Expand the description with more context about the change");
    docScore -= 15;
  } else if (prDescription.length >= 100) {
    docScore += 20;
  }

  // Check for "why" in description
  const descLower = (prDescription || "").toLowerCase();
  const hasWhy = descLower.includes("because") ||
    descLower.includes("in order to") ||
    descLower.includes("so that") ||
    descLower.includes("this fixes") ||
    descLower.includes("this adds") ||
    descLower.includes("this change");

  if (!hasWhy && prDescription) {
    missingContext.push("Description doesn't explain why the change is needed");
    suggestions.push("Add context about the business reason for this change");
    docScore -= 10;
  } else if (hasWhy) {
    docScore += 15;
  }

  // Check for ticket references
  const hasTicket = /[A-Z]+-\d+|#\d+|issues?\/\d+/i.test(prDescription || "") ||
    /jira|linear|asana|notion/i.test(prDescription || "");

  if (!hasTicket) {
    missingContext.push("No ticket or issue reference found");
    suggestions.push("Link to the ticket or issue that requested this change");
    docScore -= 10;
  } else {
    docScore += 15;
  }

  // File count consideration
  if (filesChanged.length > 20 && (!prDescription || prDescription.length < 200)) {
    missingContext.push(`Large change (${filesChanged.length} files) with limited documentation`);
    suggestions.push("Add more detailed explanation for this large change");
    docScore -= 15;
  }

  // Determine documentation quality
  let documentationQuality: DocumentationQuality;
  if (docScore >= 30) {
    documentationQuality = "COMPLETE";
  } else if (docScore >= 0) {
    documentationQuality = "PARTIAL";
  } else {
    documentationQuality = "INSUFFICIENT";
  }

  // Intent alignment - can only be UNCLEAR without AI
  const intentAlignment: IntentAlignment = prDescription ? "UNCLEAR" : "UNCLEAR";

  // Audit readiness
  let auditReadiness: AuditReadiness;
  if (documentationQuality === "COMPLETE" && missingContext.length === 0) {
    auditReadiness = "READY";
  } else if (documentationQuality === "INSUFFICIENT") {
    auditReadiness = "NOT_READY";
  } else {
    auditReadiness = "NEEDS_WORK";
  }

  // Generate summary
  const summary = prDescription
    ? `${prTitle} was submitted with ${prDescription.length > 100 ? "detailed" : "brief"} documentation. ${missingContext.length > 0 ? `Missing: ${missingContext.join(", ")}.` : "Core documentation is present."}`
    : `${prTitle} was submitted without a description. Documentation is needed for audit purposes.`;

  return {
    documentationQuality,
    intentAlignment,
    auditReadiness,
    summary,
    missingContext: missingContext.slice(0, 5),
    suggestions: suggestions.slice(0, 3),
  };
}

function getRuleBasedAuditSummary(der: DERForAudit): AuditSummary {
  const approvers = der.reviews
    .filter(r => r.state === "APPROVED")
    .map(r => r.author);

  const approvalText = approvers.length > 0
    ? `Approved by ${approvers.join(", ")}.`
    : "Pending approval.";

  const ticketText = der.ticketLinks.length > 0
    ? `Linked to ${der.ticketLinks.join(", ")}.`
    : "";

  const summary = `${der.prTitle} was submitted by ${der.prAuthor} on ${der.createdAt.toLocaleDateString()}. ${approvalText} ${ticketText} Evidence score: ${der.evidenceScore}/100.`.trim();

  // Extract key changes from description
  const keyChanges: string[] = [];
  if (der.description) {
    const lines = der.description.split("\n").filter(l => l.trim());
    for (const line of lines.slice(0, 5)) {
      if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
        keyChanges.push(line.replace(/^[-*•]\s*/, "").trim());
      }
    }
  }
  if (keyChanges.length === 0) {
    keyChanges.push(der.prTitle);
  }

  // Determine audit readiness from gaps
  const hasHighGaps = der.gaps.some(g => !g.resolved && (g.type === "MISSING_APPROVAL" || g.type === "MISSING_DESCRIPTION"));
  const auditReadiness: AuditReadiness = hasHighGaps ? "NOT_READY" : der.evidenceScore < 50 ? "NEEDS_WORK" : "READY";

  return { summary, keyChanges: keyChanges.slice(0, 3), auditReadiness };
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  GitPullRequest,
  Shield,
  Brain,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Play,
  Clock,
  Users,
  FileText,
  Github,
  Check,
  X,
  Minus,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Ticket,
  Eye,
  Sparkles,
  Target,
  Zap,
  Layers,
  Search,
  BarChart3,
  XCircle,
  Circle,
  ExternalLink,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
  Database,
  GitBranch,
  Calendar,
  RefreshCw,
  Bot,
  Hash,
} from "lucide-react";

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated section wrapper
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Evidence Score Ring Component
function EvidenceScoreRing({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#4a7c59" : score >= 50 ? "#d4a853" : "#c45c5c";

  const dimensions = size === "lg" ? "w-28 h-28" : "w-16 h-16";
  const textSize = size === "lg" ? "text-3xl" : "text-lg";
  const labelSize = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <div className={`relative ${dimensions}`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${textSize} font-bold`} style={{ color }}>{score}</span>
        <span className={`${labelSize} text-muted-foreground`}>Score</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [expandedControl, setExpandedControl] = useState<string | null>("dora-art9e");
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText("sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background via-background to-navy/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber/10 via-transparent to-transparent opacity-50" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <AnimatedSection>
              <Badge
                variant="outline"
                className="mb-6 px-4 py-2 text-sm font-medium border-amber/30 bg-amber/5 text-navy"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2 text-amber" />
                The Decision Intelligence Layer for Engineering
              </Badge>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-navy tracking-tight mb-6 leading-[1.1]">
                Every Code Change Has a Story.
                <br />
                <span className="text-amber">MergeWhy Captures It.</span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
                The missing layer between your code and your compliance. MergeWhy assembles
                evidence from GitHub, Jira, and Slack into a single decision record —
                analyzed by AI, evaluated against compliance frameworks, and sealed in an
                immutable vault.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-navy hover:bg-navy-light text-white px-8 py-6 text-lg w-full sm:w-auto group"
                >
                  <Link href="/sign-up">
                    See Your First PR Analyzed
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-lg border-navy/30 text-navy hover:bg-navy/5 w-full sm:w-auto"
                >
                  <a href="#how-it-works">
                    <Play className="mr-2 w-5 h-5" />
                    Watch It Work
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Connect GitHub → See results in 2 minutes → No credit card required
              </p>
            </AnimatedSection>
          </div>

          {/* Hero Demo - Full Record Detail */}
          <AnimatedSection delay={400}>
            <div className="max-w-6xl mx-auto">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-navy/30 via-amber/30 to-navy/30 rounded-3xl blur-2xl opacity-30" />

                <div className="relative bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
                  {/* Browser Chrome */}
                  <div className="bg-gradient-to-r from-navy to-navy-light px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white/10 rounded-md px-4 py-1.5 text-xs text-white/70 flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        app.mergewhy.com/dashboard/records/der_8f2k...
                      </div>
                    </div>
                  </div>

                  {/* Record Detail Content */}
                  <div className="p-6 bg-gradient-to-br from-[#faf8f5] to-[#f5f3f0]">
                    {/* Breadcrumb & Header */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span>Dashboard</span>
                      <ChevronRight className="w-4 h-4" />
                      <span>Records</span>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-navy font-medium">#287</span>
                    </div>

                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="text-xs">MERGED</Badge>
                          <Badge className="bg-amber/20 text-amber border-amber/30 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            NEEDS_REVIEW
                          </Badge>
                        </div>
                        <h2 className="text-xl font-semibold text-navy mb-1">
                          Implement retry logic for failed payment webhooks
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <a href="#" className="flex items-center gap-1 hover:text-navy">
                            <GitPullRequest className="w-4 h-4" />
                            #287
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-4 h-4" />
                            acme/payments-api
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            sarah.chen
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            2 hours ago
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Re-analyze
                        </Button>
                        <Button size="sm" className="bg-navy">
                          <FileText className="w-4 h-4 mr-1" />
                          Export PDF
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Main Content */}
                      <div className="lg:col-span-2 space-y-5">
                        {/* Evidence Score Card */}
                        <div className="bg-white rounded-xl border border-border p-5">
                          <div className="flex items-center gap-6">
                            <EvidenceScoreRing score={73} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-amber border-amber/30 bg-amber/5">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  2 gaps detected
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Some evidence gaps need attention before this PR is fully audit-ready.
                                Address the missing review approval and Slack context.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* AI Documentation Analysis */}
                        <div className="bg-white rounded-xl border border-amber/30 overflow-hidden">
                          <div className="bg-gradient-to-r from-amber/10 to-transparent px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-amber/20 rounded-lg">
                                <Bot className="w-4 h-4 text-amber" />
                              </div>
                              <span className="font-medium text-navy">AI Documentation Analysis</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Analyzed 2 min ago</span>
                          </div>
                          <div className="p-5 space-y-4">
                            {/* Analysis Badges */}
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber/10 text-amber">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Partial Documentation</span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-green-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Intent Aligned</span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber/10 text-amber">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="text-sm font-medium">Needs Work</span>
                              </div>
                            </div>

                            {/* Missing Context */}
                            <div className="bg-amber/5 border border-amber/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-amber mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                Missing Context
                              </div>
                              <ul className="space-y-1.5 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-amber">-</span>
                                  No explanation of why exponential backoff was chosen over linear
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-amber">-</span>
                                  Missing context on max retry limit decision (why 5?)
                                </li>
                              </ul>
                            </div>

                            {/* AI Suggestions */}
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                <Lightbulb className="w-4 h-4 text-amber" />
                                How to Improve
                              </div>
                              <ul className="space-y-1.5 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-amber">→</span>
                                  Add comment explaining the retry strategy decision
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-amber">→</span>
                                  Link the Slack discussion about the incident that triggered this
                                </li>
                              </ul>
                            </div>

                            {/* AI Summary */}
                            <div className="pt-3 border-t">
                              <div className="text-sm font-medium mb-2">Audit Summary</div>
                              <p className="text-sm text-muted-foreground">
                                This PR implements payment webhook retry logic following a recent
                                incident (INCIDENT-892). The technical implementation is sound, but
                                the decision rationale for specific parameters (backoff strategy,
                                retry limits) is not documented. Recommend adding context before
                                auditor review.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Compliance Evaluation */}
                        <div className="bg-white rounded-xl border border-navy/20 overflow-hidden">
                          <div className="bg-gradient-to-r from-navy/5 to-transparent px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-navy/10 rounded-lg">
                                <ShieldCheck className="w-4 h-4 text-navy" />
                              </div>
                              <span className="font-medium text-navy">Compliance Evaluation</span>
                            </div>
                            <Badge variant="outline" className="text-xs">3 frameworks</Badge>
                          </div>
                          <div className="divide-y divide-border/50">
                            {/* DORA */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🇪🇺</span>
                                  <span className="font-medium">DORA</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-amber">67%</span>
                                  <Badge variant="outline" className="text-amber border-amber/30">
                                    Partial
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <button
                                  onClick={() => setExpandedControl(expandedControl === "dora-art9e" ? null : "dora-art9e")}
                                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedControl === "dora-art9e" ? "rotate-90" : ""}`} />
                                    <code className="text-xs text-muted-foreground">Art.9(4)(e)</code>
                                    <span className="text-sm">ICT Change Management</span>
                                  </div>
                                  <Badge variant="outline" className="text-amber border-amber/30 text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Warning
                                  </Badge>
                                </button>
                                {expandedControl === "dora-art9e" && (
                                  <div className="ml-6 p-3 bg-muted/30 rounded-lg space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      <span>Change documented</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-4 h-4 text-red-500" />
                                      <span className="text-red-600">Missing approval from code owner</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      <span>Ticket linked (PAY-1247)</span>
                                    </div>
                                    <div className="mt-2 p-2 bg-amber/10 rounded text-amber text-xs">
                                      <Lightbulb className="w-3 h-3 inline mr-1" />
                                      Recommendation: Get approval from @payments-team before merge
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4" />
                                    <code className="text-xs text-muted-foreground">Art.9(4)(c)</code>
                                    <span className="text-sm">Testing Requirements</span>
                                  </div>
                                  <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Pass
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* SOC 2 */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🔐</span>
                                  <span className="font-medium">SOC 2 Type II</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-amber">50%</span>
                                  <Badge variant="outline" className="text-amber border-amber/30">
                                    Partial
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* ISO 27001 */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🛡️</span>
                                  <span className="font-medium">ISO 27001</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-red-500">33%</span>
                                  <Badge variant="outline" className="text-red-500 border-red-200">
                                    Non-Compliant
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-5">
                        {/* Cross-Tool Evidence */}
                        <div className="bg-white rounded-xl border border-border p-5">
                          <div className="font-medium text-navy mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Evidence Assembled
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="p-2 bg-black rounded-lg">
                                <Github className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">GitHub PR #287</div>
                                <div className="text-xs text-muted-foreground truncate">12 commits, 847 additions</div>
                              </div>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="p-2 bg-blue-600 rounded-lg">
                                <Ticket className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">Jira PAY-1247</div>
                                <div className="text-xs text-muted-foreground truncate">Webhook retry implementation</div>
                              </div>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber/10 border border-amber/20">
                              <div className="p-2 bg-purple-600 rounded-lg">
                                <MessageSquare className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-amber">Slack Thread</div>
                                <div className="text-xs text-amber">Not linked</div>
                              </div>
                              <AlertTriangle className="w-4 h-4 text-amber" />
                            </div>
                          </div>
                        </div>

                        {/* Evidence Vault */}
                        <div className="bg-gradient-to-br from-navy/5 to-amber/5 rounded-xl border border-navy/20 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-green-100 rounded-lg">
                              <Lock className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium text-navy">Evidence Vault</span>
                            <Badge className="bg-green-100 text-green-700 text-xs ml-auto">
                              Sealed
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Integrity Hash</div>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-white px-2 py-1.5 rounded border font-mono truncate">
                                  sha256:7f83b165...126d9069
                                </code>
                                <button
                                  onClick={copyHash}
                                  className="p-1.5 hover:bg-white rounded transition-colors"
                                >
                                  {copied ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground">Reviews</span>
                                <div className="font-medium">2</div>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground">Approvals</span>
                                <div className="font-medium text-red-500">0</div>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground">Tickets</span>
                                <div className="font-medium">1</div>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground">Files</span>
                                <div className="font-medium">14</div>
                              </div>
                            </div>

                            <Button variant="outline" size="sm" className="w-full">
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Verify Integrity
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                              Sealed on merge • Tamper-evident
                            </p>
                          </div>
                        </div>

                        {/* PR Details */}
                        <div className="bg-white rounded-xl border border-border p-5">
                          <div className="font-medium text-navy mb-3 flex items-center gap-2">
                            <GitBranch className="w-4 h-4" />
                            PR Details
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Base</span>
                              <code className="text-xs">main</code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Head</span>
                              <code className="text-xs">feat/webhook-retry</code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Merged</span>
                              <span className="text-xs">Jan 15, 2025</span>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="text-muted-foreground mb-1">Linked Tickets</div>
                              <Badge variant="outline" className="text-xs">PAY-1247</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Problem Section - Case Studies */}
      <section className="py-20 bg-navy text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center mb-12">
              <Badge className="mb-6 bg-red-500/20 text-red-200 border-red-400/30">
                The Cost of Lost Context
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                Every Major Incident Has the Same Root Cause
              </h2>
              <p className="text-lg text-white/70">
                &ldquo;We don&apos;t know why this decision was made.&rdquo;
              </p>
            </div>
          </AnimatedSection>

          {/* Case Studies Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            {[
              {
                company: "Knight Capital",
                year: "2012",
                impact: "$440M loss in 45 minutes",
                description: "Old trading code was accidentally deployed to production. No one could explain why it was still in the codebase or who approved the deployment.",
                question: "Why was this code still deployed?",
                color: "from-red-500/20 to-red-500/5",
              },
              {
                company: "GitLab",
                year: "2017",
                impact: "6 hours of production data lost",
                description: "An engineer deleted the wrong database during an incident. The sequence of commands and decisions leading to the deletion was reconstructed from chat logs.",
                question: "Which command caused this and why?",
                color: "from-orange-500/20 to-orange-500/5",
              },
              {
                company: "Cloudflare",
                year: "2019",
                impact: "27 minutes of global outage",
                description: "A regex pattern caused CPU exhaustion. The change had been reviewed and approved, but the decision rationale for the complex regex was never documented.",
                question: "Who approved this and what was the reasoning?",
                color: "from-yellow-500/20 to-yellow-500/5",
              },
              {
                company: "CrowdStrike",
                year: "2024",
                impact: "8.5M Windows systems crashed",
                description: "A faulty content update bypassed standard testing. Investigators are still piecing together the decision process that led to the deployment.",
                question: "What was the decision process?",
                color: "from-purple-500/20 to-purple-500/5",
              },
            ].map((incident, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className={`p-6 rounded-xl bg-gradient-to-br ${incident.color} border border-white/10 h-full`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg">{incident.company}</span>
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      {incident.year}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-amber mb-3">
                    {incident.impact}
                  </div>
                  <p className="text-sm text-white/70 mb-4">
                    {incident.description}
                  </p>
                  <div className="p-3 rounded-lg bg-white/10 border border-white/10">
                    <p className="text-sm font-medium text-amber">
                      &ldquo;{incident.question}&rdquo;
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <div className="p-6 rounded-xl bg-gradient-to-r from-amber/20 to-transparent border-l-4 border-amber">
                <p className="text-xl font-serif">
                  Could your team answer{" "}
                  <span className="text-amber font-semibold">WHY</span> the last
                  production incident happened?
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* The Missing Layer */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                The Missing Layer
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
                Every Tool Tells You What.
                <br />
                <span className="text-amber">Only MergeWhy Tells You Why.</span>
              </h2>
            </div>
          </AnimatedSection>

          {/* Stack Diagram */}
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Connection Lines */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-border via-amber to-border" />

                <div className="space-y-4">
                  {[
                    { icon: Github, name: "GitHub", describes: "What changed, who changed it", color: "bg-black", hasIt: true },
                    { icon: Ticket, name: "Jira / Linear", describes: "What was requested", color: "bg-blue-600", hasIt: true },
                    { icon: MessageSquare, name: "Slack", describes: "Where it was discussed", color: "bg-purple-600", hasIt: true },
                    { icon: Zap, name: "CI/CD", describes: "How it was tested", color: "bg-green-600", hasIt: true },
                  ].map((tool, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex-1 flex justify-end">
                        <div className="bg-white rounded-xl border border-border p-4 shadow-sm max-w-xs w-full">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${tool.color} rounded-lg`}>
                              <tool.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{tool.name}</div>
                              <div className="text-sm text-muted-foreground">{tool.describes}</div>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                          </div>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-border z-10" />
                      <div className="flex-1" />
                    </div>
                  ))}

                  {/* MergeWhy - The Missing Layer */}
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex-1" />
                    <div className="relative z-10">
                      <div className="absolute -inset-2 bg-amber/30 rounded-full blur-lg" />
                      <div className="relative w-6 h-6 rounded-full bg-amber" />
                    </div>
                    <div className="flex-1 flex justify-start">
                      <div className="bg-gradient-to-r from-navy to-navy-light rounded-xl p-4 shadow-xl max-w-xs w-full border-2 border-amber">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber rounded-lg">
                            <Brain className="w-5 h-5 text-navy" />
                          </div>
                          <div className="text-white">
                            <div className="font-semibold">MergeWhy</div>
                            <div className="text-sm text-white/70">WHY it was decided</div>
                          </div>
                          <Sparkles className="w-5 h-5 text-amber ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  MergeWhy doesn&apos;t replace your tools — it{" "}
                  <span className="text-navy font-semibold">connects them</span>.
                  We assemble evidence from across your stack into a single,
                  auditable decision record.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* AI Intelligence Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Bot className="w-3.5 h-3.5 mr-2" />
                AI-Powered Intelligence
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
                Not Just &ldquo;Description Exists&rdquo;
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                MergeWhy&apos;s AI doesn&apos;t just check boxes. It reads, understands,
                and evaluates your documentation like an auditor would.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Documentation Quality",
                values: ["Complete", "Partial", "Insufficient"],
                description: "Does the PR description actually explain what was done?",
                icon: FileText,
                example: "Partial — Technical changes documented, but business rationale missing",
              },
              {
                title: "Intent Alignment",
                values: ["Aligned", "Unclear", "Misaligned"],
                description: "Does the code change match the stated goal?",
                icon: Target,
                example: "Aligned — Code implements the retry logic described in ticket",
              },
              {
                title: "Audit Readiness",
                values: ["Ready", "Needs Work", "Not Ready"],
                description: "Can an external auditor understand this decision?",
                icon: ShieldCheck,
                example: "Needs Work — Missing approval chain documentation",
              },
              {
                title: "Missing Context",
                values: ["Specific gaps identified"],
                description: "What exactly is missing from the documentation?",
                icon: Search,
                example: "No explanation of why exponential backoff was chosen",
              },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="bg-white rounded-xl border border-border p-5 h-full hover:shadow-lg hover:border-amber/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-navy" />
                  </div>
                  <h3 className="font-semibold text-navy mb-2">{item.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.values.map((v, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {v}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {item.description}
                  </p>
                  <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground italic">
                    {item.example}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Engine Deep Dive */}
      <section id="features" className="py-20 bg-navy text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-amber/20 text-amber border-amber/30">
                Compliance Engine
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                Same Evidence. Different Rules.
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Each framework has different requirements. MergeWhy evaluates your
                evidence against the specific controls you need to satisfy.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "SOC 2 Type II",
                icon: "🔐",
                control: "CC8.1",
                title: "Change Management",
                requirements: [
                  { name: "Approval Required", detail: "At least 1 approved review" },
                  { name: "Documentation", detail: "PR description explains change" },
                  { name: "Segregation", detail: "Author ≠ Approver" },
                  { name: "Testing Evidence", detail: "CI/CD pipeline passed" },
                ],
                color: "from-blue-500/20",
              },
              {
                name: "DORA",
                icon: "🇪🇺",
                control: "Art.9(4)(e)",
                title: "ICT Change Management",
                requirements: [
                  { name: "Risk Assessment", detail: "Changes to sensitive files flagged" },
                  { name: "Enhanced Review", detail: "Additional scrutiny for payments/*" },
                  { name: "Rollback Plan", detail: "Documented in PR or ticket" },
                  { name: "Audit Trail", detail: "Complete evidence chain" },
                ],
                color: "from-purple-500/20",
              },
              {
                name: "ISO 27001",
                icon: "🛡️",
                control: "A.8.32",
                title: "Change Management",
                requirements: [
                  { name: "Formal Review", detail: "Code review completed" },
                  { name: "Authorization", detail: "Approval from authorized personnel" },
                  { name: "Documentation", detail: "Change documented and tracked" },
                  { name: "Communication", detail: "Stakeholders notified" },
                ],
                color: "from-green-500/20",
              },
            ].map((framework, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className={`bg-gradient-to-br ${framework.color} to-transparent rounded-xl border border-white/10 p-6 h-full`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{framework.icon}</span>
                    <div>
                      <div className="font-semibold text-lg">{framework.name}</div>
                      <code className="text-xs text-white/50">{framework.control}</code>
                    </div>
                  </div>
                  <div className="text-amber font-medium mb-4">{framework.title}</div>
                  <div className="space-y-3">
                    {framework.requirements.map((req, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white/50 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">{req.name}</div>
                          <div className="text-xs text-white/50">{req.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection>
            <div className="text-center mt-12">
              <p className="text-white/70 max-w-xl mx-auto">
                Enable multiple frameworks. MergeWhy evaluates each PR against all
                of them simultaneously, showing you exactly where you stand.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="secondary" className="mb-4">
                  Our Vision
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
                  The Memory Layer for Engineering
                </h2>
                <p className="text-xl text-muted-foreground">
                  What you see today is{" "}
                  <span className="text-amber font-semibold">Phase 1</span>.
                  Here&apos;s where we&apos;re going.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                phase: "Phase 1",
                status: "Live Now",
                title: "PR Evidence Capture & Compliance",
                items: ["Automatic evidence collection", "AI documentation analysis", "Multi-framework compliance evaluation", "Immutable evidence vault"],
                active: true,
              },
              {
                phase: "Phase 2",
                status: "Q2 2025",
                title: "Deep Integrations",
                items: ["Real Jira/Linear ticket data sync", "Slack thread capture & analysis", "PDF audit report generation", "Custom framework builder"],
                active: false,
              },
              {
                phase: "Phase 3",
                status: "Q3 2025",
                title: "Incident Correlation",
                items: ["\"What changed before this broke?\"", "Automatic incident-to-PR linking", "Risk scoring based on change patterns", "Predictive gap detection"],
                active: false,
              },
              {
                phase: "Phase 4",
                status: "2026",
                title: "Decision Intelligence Platform",
                items: ["Searchable decision history", "Team decision patterns analytics", "\"Why did we build it this way?\"", "Institutional knowledge preservation"],
                active: false,
              },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div
                  className={`p-6 rounded-xl border ${
                    item.active
                      ? "bg-gradient-to-r from-amber/10 to-transparent border-amber/30"
                      : "bg-white border-border"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.active ? "bg-amber text-navy" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.active ? <Zap className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-navy">{item.phase}</span>
                        <Badge variant={item.active ? "default" : "outline"} className={item.active ? "bg-amber text-navy" : ""}>
                          {item.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-navy mb-2">{item.title}</h3>
                      <ul className="grid grid-cols-2 gap-2">
                        {item.items.map((feature, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className={`w-4 h-4 ${item.active ? "text-amber" : "text-muted-foreground/50"}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy mb-4">
                Start Free. Scale When Ready.
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Pilot",
                price: "Free",
                period: "forever",
                description: "Perfect for evaluation",
                features: ["1 repository", "50 PRs/month", "All compliance frameworks", "7-day evidence history", "Community support"],
                cta: "Start Free Pilot",
                highlighted: false,
              },
              {
                name: "Starter",
                price: "$500",
                period: "/month",
                description: "For growing teams",
                features: ["5 repositories", "200 DERs/month", "90-day evidence history", "PDF exports", "Email support", "API access"],
                cta: "Start 14-Day Trial",
                highlighted: false,
              },
              {
                name: "Growth",
                price: "$2,000",
                period: "/month",
                description: "For compliance-focused teams",
                features: ["Unlimited repositories", "1,000 DERs/month", "Unlimited history", "Priority support", "Custom integrations", "Evidence vault API"],
                cta: "Start 14-Day Trial",
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                description: "For large organizations",
                features: ["Everything in Growth", "SSO & SAML", "Custom SLA", "Dedicated CSM", "On-premise option", "Custom frameworks"],
                cta: "Talk to Sales",
                highlighted: false,
              },
            ].map((plan, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div
                  className={`relative rounded-xl p-6 h-full flex flex-col ${
                    plan.highlighted
                      ? "bg-navy text-white border-2 border-amber scale-105 shadow-xl"
                      : "bg-white border border-border"
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber text-navy">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <h3 className={`font-semibold text-lg mb-2 ${plan.highlighted ? "text-white" : "text-navy"}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-navy"}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={plan.highlighted ? "text-white/70" : "text-muted-foreground"}>
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-2 ${plan.highlighted ? "text-white/70" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            plan.highlighted ? "text-amber" : "text-green-500"
                          }`}
                        />
                        <span className={plan.highlighted ? "text-white/90" : ""}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full mt-auto ${
                      plan.highlighted
                        ? "bg-amber hover:bg-amber-light text-navy"
                        : "bg-navy hover:bg-navy-light text-white"
                    }`}
                  >
                    <Link href={plan.name === "Enterprise" ? "/contact" : "/sign-up"}>
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-navy text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                See Your First PR Analyzed in 2 Minutes
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Connect GitHub. Select a repo. Watch MergeWhy capture the decision
                context your auditors will thank you for.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-amber hover:bg-amber-light text-navy px-8 py-6 text-lg w-full sm:w-auto group"
                >
                  <Link href="/sign-up">
                    <Github className="mr-2 w-5 h-5" />
                    Connect GitHub & Start Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Or enter your email for updates"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-amber"
                />
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 whitespace-nowrap">
                  Notify Me
                </Button>
              </div>

              <p className="text-sm text-white/50 mt-6">
                No credit card required • 2-minute setup • Works with any GitHub repo
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

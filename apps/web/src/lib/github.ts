import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

function getPrivateKey(): string {
  const key = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!key) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not configured");
  }
  // Handle escaped newlines in env var
  return key.replace(/\\n/g, "\n");
}

export function getAppOctokit(): Octokit {
  if (!process.env.GITHUB_APP_ID) {
    throw new Error("GITHUB_APP_ID is not configured");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: getPrivateKey(),
    },
  });
}

export async function getInstallationOctokit(
  installationId: number
): Promise<Octokit> {
  const appOctokit = getAppOctokit();

  const { token } = (await appOctokit.auth({
    type: "installation",
    installationId,
  })) as { token: string };

  return new Octokit({ auth: token });
}

export interface PullRequestData {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
  merged: boolean;
  merged_at: string | null;
}

export interface ReviewData {
  id: number;
  user: {
    login: string;
  };
  state: string;
  body: string | null;
  submitted_at: string;
}

export async function fetchPullRequestDetails(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<{
  pullRequest: PullRequestData;
  reviews: ReviewData[];
  comments: Array<{ id: number; user: { login: string }; body: string; created_at: string }>;
}> {
  const [prResponse, reviewsResponse, commentsResponse] = await Promise.all([
    octokit.pulls.get({ owner, repo, pull_number: prNumber }),
    octokit.pulls.listReviews({ owner, repo, pull_number: prNumber }),
    octokit.issues.listComments({ owner, repo, issue_number: prNumber }),
  ]);

  return {
    pullRequest: prResponse.data as PullRequestData,
    reviews: reviewsResponse.data as ReviewData[],
    comments: commentsResponse.data.map((c) => ({
      id: c.id,
      user: { login: c.user?.login || "unknown" },
      body: c.body || "",
      created_at: c.created_at,
    })),
  };
}

import process from "node:process";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const apiRoot = process.env.GITHUB_API_URL || "https://api.github.com";

if (!token || !repository) throw new Error("GitHub Actions credentials are required");

const ideas = [
  {
    title: "How refugee family reunification works",
    angle: "Explore why separated families may wait a long time to reunite and what protection systems try to do.",
    source: "https://www.unhcr.org/what-we-do/protect-human-rights/protection/family-reunification"
  },
  {
    title: "Why identity documents matter during displacement",
    angle: "Learn how birth certificates and identity documents affect education, healthcare, travel, and legal protection.",
    source: "https://www.unhcr.org/what-we-do/protect-human-rights/ending-statelessness"
  },
  {
    title: "What happens when a refugee returns home",
    angle: "Study voluntary return, safety, rebuilding, and why returning is not always immediately possible.",
    source: "https://www.unhcr.org/what-we-do/build-better-futures/long-term-solutions/voluntary-repatriation"
  },
  {
    title: "How refugee education continues during emergencies",
    angle: "Understand temporary classrooms, language support, lost school records, and inclusive education.",
    source: "https://www.unhcr.org/what-we-do/build-better-futures/education"
  }
];

async function github(path, options = {}) {
  const response = await fetch(`${apiRoot}/repos/${repository}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`GitHub API failed (${response.status}): ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

const ideaList = ideas.map((idea, index) => `### ${index + 1}. ${idea.title}\n${idea.angle}\n\n[Starting source](${idea.source})`).join("\n\n");
const issue = await github("/issues", {
  method: "POST",
  body: JSON.stringify({
    title: "[TEST] Choose an Extra Concept",
    body: `This is the branch-only 30-second mechanism test. No live website content will be changed.\n\n${ideaList}\n\n## Choose\nComment **/choose 1**, **/choose 2**, **/choose 3**, or **/choose 4** below. This test waits up to 15 minutes.`
  })
});

console.log(`Test issue created: ${issue.html_url}`);
const deadline = Date.now() + 15 * 60 * 1000;
let selection;

while (Date.now() < deadline && !selection) {
  const comments = await github(`/issues/${issue.number}/comments?per_page=100`);
  for (const comment of comments) {
    if (comment.user?.type === "Bot") continue;
    const match = comment.body?.trim().match(/^\/choose\s+([1-4])\b/i);
    if (match) {
      selection = { number: Number(match[1]), user: comment.user.login };
      break;
    }
  }
  if (!selection) await new Promise(resolve => setTimeout(resolve, 10000));
}

if (!selection) {
  await github(`/issues/${issue.number}/comments`, { method: "POST", body: JSON.stringify({ body: "The branch test timed out after 15 minutes without a valid `/choose 1-4` comment. Run the test again when ready." }) });
  throw new Error("No selection received before the test timeout");
}

const selected = ideas[selection.number - 1];
await github(`/issues/${issue.number}/comments`, {
  method: "POST",
  body: JSON.stringify({ body: `Selection received from @${selection.user}: **${selected.title}**. The 30-second test research cycle has started.` })
});

await new Promise(resolve => setTimeout(resolve, 30000));

await github(`/issues/${issue.number}/comments`, {
  method: "POST",
  body: JSON.stringify({ body: `## Test research completed ✅\n\n**Selected concept:** ${selected.title}\n\n**Proposed direction:** ${selected.angle}\n\n**Authoritative starting source:** ${selected.source}\n\nThis was a mechanism test, so it did not generate or publish a live article. The production version will collect multiple authoritative sources during the week and publish only after the Friday workflow.` })
});

console.log("Thirty-second selection and research mechanism test completed.");

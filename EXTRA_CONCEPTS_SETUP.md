# Extra Concepts automation

The website remains static on GitHub Pages. GitHub Actions supplies the scheduled backend.

## Weekly flow

1. Sunday at 10:00 IST: scan existing site topics, research authoritative sources, save four distinct ideas, and create a GitHub Issue.
2. Choose an idea by commenting `/choose 1`, `/choose 2`, `/choose 3`, or `/choose 4` on that Issue.
3. On selection and each weekday at 18:00 IST: add a source-backed research pass.
4. Friday at 20:00 IST: build the article, add it to Extra Concepts and the sitemap, commit it, and post its link to the Issue.

Scheduled workflows only run after this workflow reaches the repository's default branch. On the feature branch, use **Run workflow** for testing.

## Authentication

GitHub automatically supplies `GITHUB_TOKEN` for creating Issues and comments. No email service, Gmail password, or personal GitHub token is needed. GitHub notification emails depend on the user's repository notification settings.

The production research and writing stage currently expects `OPENAI_API_KEY`. The branch-only 30-second mechanism test does not use it.

An optional Actions variable named `OPENAI_MODEL` can select another Responses API model.

## Branch test

Changing the workflow on `codex/extra-concepts-automation` starts a test that creates an Issue, waits up to 15 minutes for `/choose 1-4`, waits 30 seconds, and posts a simulated research result. It does not publish an article.

Secrets must never be committed to the repository or pasted into HTML, workflow files, or issues.

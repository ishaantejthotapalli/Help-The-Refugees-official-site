# Extra Concepts automation

The website remains static on GitHub Pages. GitHub Actions supplies the scheduled backend.

## Weekly flow

1. Sunday at 10:00 IST: scan existing site topics, research authoritative sources, save four distinct ideas, and email them.
2. Choose an idea from **Actions → Extra Concepts Research → Run workflow**. Select `select` and enter `1`, `2`, `3`, or `4`.
3. On selection and each weekday at 18:00 IST: add a source-backed research pass.
4. Friday at 20:00 IST: build the article, add it to Extra Concepts and the sitemap, commit it, and email its link.

Scheduled workflows only run after this workflow reaches the repository's default branch. On the feature branch, use **Run workflow** for testing.

## Required repository secrets

Add these under **Settings → Secrets and variables → Actions**:

- `OPENAI_API_KEY`: API credential used for source-backed research and writing.
- `RESEND_API_KEY`: free Resend credential used to send the emails.
- `EXTRA_CONCEPTS_RECIPIENT`: set to `ishaantejthotapalli@gmail.com` (optional because this is the safe fallback).
- `EXTRA_CONCEPTS_FROM`: optional verified sender. Until a domain is available, use `Help The Refugees <onboarding@resend.dev>` and create the Resend account with the recipient address.

An optional Actions variable named `OPENAI_MODEL` can select another Responses API model.

## Test today

Push the branch, open **Actions → Extra Concepts Research**, select this branch, run `email-test`, and confirm that the message arrives. Then run `ideas` to test the full research email.

Secrets must never be committed to the repository or pasted into HTML, workflow files, or issues.

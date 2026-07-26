# Help The Refugees

An educational, child-friendly static website that helps young visitors learn about forced displacement through stories, statistics, maps and interactive games.

## Live data

### Refugee news

`.github/workflows/update-news.yml` runs daily and writes validated stories to `news.json`; the homepage displays the four most recent stories. The workflow requires the repository Actions secret `NEWS_API_KEY`. The key is read only by `fetchNews.js` on the GitHub Actions runner and must never be committed.

Run **Actions → Update Refugee News → Run workflow** after configuring or rotating the secret.

### Refugee statistics

`.github/workflows/update-statistics.yml` checks the public UNHCR Refugee Data Finder API hourly and writes `statistics.json`. Checking hourly does not imply that UNHCR publishes new figures hourly; the page always shows the source reporting year and check date.

The workflow combines UNHCR population, UNRWA and IDMC datasets for its displacement total and calculates the child share from available demographic age bands. It preserves the last committed data when validation or an upstream request fails.

Run **Actions → Update Refugee Statistics → Run workflow** to populate the initial data after deployment.

## Local preview

Serve the repository over HTTP so the JSON feeds can load:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Search and answer-engine visibility

- The canonical site origin is `https://ishaantejthotapalli.github.io/Help-The-Refugees-official-site/`.
- `robots.txt` permits Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User and other public crawlers.
- `sitemap.xml` contains every canonical indexable page and should be submitted in Google Search Console and Bing Webmaster Tools after deployment.
- Important pages include self-referencing canonical URLs, unique descriptions and machine-readable JSON-LD where relevant.
- Run the SEO integrity check before publishing metadata or navigation changes:

```bash
node scripts/check-seo.cjs
```

Search engine submission requires access to the verified Google Search Console and Bing Webmaster Tools properties and cannot be completed through repository code alone.

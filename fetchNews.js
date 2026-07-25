const fs = require("fs");

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OUTPUT_FILE = "news.json";

if (!NEWS_API_KEY) {
    console.error("NEWS_API_KEY is not configured.");
    process.exit(1);
}

const params = new URLSearchParams({
    q: '(refugee OR refugees OR "forced displacement")',
    language: "en",
    pageSize: "10",
    sortBy: "publishedAt",
    apiKey: NEWS_API_KEY
});

function cleanText(value, fallback = "") {
    return typeof value === "string" ? value.trim() : fallback;
}

function isUsableArticle(article) {
    return article &&
        cleanText(article.title) &&
        cleanText(article.url).startsWith("http") &&
        article.title !== "[Removed]";
}

async function updateNews() {
    const response = await fetch(`https://newsapi.org/v2/everything?${params}`);
    const data = await response.json();

    if (!response.ok || data.status === "error") {
        throw new Error(data.message || `News API returned ${response.status}`);
    }

    const articles = (data.articles || [])
        .filter(isUsableArticle)
        .slice(0, 5)
        .map(article => ({
            title: cleanText(article.title),
            summary: cleanText(article.description, "Open the story to learn more."),
            image: cleanText(article.urlToImage),
            url: cleanText(article.url),
            source: cleanText(article.source?.name, "News source"),
            published: cleanText(article.publishedAt)
        }));

    if (articles.length === 0) {
        throw new Error("News API returned no usable refugee stories.");
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        articles
    }, null, 2) + "\n");

    console.log(`Updated ${OUTPUT_FILE} with ${articles.length} stories.`);
}

updateNews().catch(error => {
    // Keep the last known-good JSON instead of replacing it with an error.
    console.error(error.message);
    process.exit(1);
});

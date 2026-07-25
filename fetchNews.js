const fs = require("fs");

const NEWS_API_KEY = "process.env.NEWS_API_KEY";

const url =
`https://newsapi.org/v2/everything?q=refugees&language=en&pageSize=1&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

async function updateNews() {

    try {

        const response = await fetch(url);

        const data = await response.json();

        if (!data.articles || data.articles.length === 0) {
            console.log("No articles found.");
            return;
        }

        const article = data.articles[0];

        const news = {

            lastUpdated: new Date().toISOString(),

            article: {

                title: article.title,

                summary: article.description,

                image: article.urlToImage,

                url: article.url,

                source: article.source.name,

                published: article.publishedAt

            }

        };

        fs.writeFileSync(
            "news.json",
            JSON.stringify(news, null, 2)
        );

        console.log("news.json updated!");

    } catch (err) {

        console.error(err);

    }

}

updateNews();

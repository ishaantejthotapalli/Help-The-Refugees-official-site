const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pages = [
    ["index.html", "/"],
    ["learn/index.html", "/learn/"],
    ["learn/what-is-a-refugee.html", "/learn/what-is-a-refugee/"],
    ["learn/refugee-migrant-asylum-seeker.html", "/learn/refugee-migrant-asylum-seeker/"],
    ["learn/how-students-can-help.html", "/learn/how-students-can-help/"],
    ["games/refugee-journey.html", "/games/refugee-journey/"],
    ["games/safe-passage.html", "/games/safe-passage/"],
    ["more-info/world-crisis-map.html", "/more-info/world-crisis-map/"],
    ["more-info/hardships.html", "/more-info/hardships/"],
    ["more-info/videos.html", "/more-info/videos/"],
    ["events.html", "/events/"],
    ["feedback.html", "/feedback/"],
    ["about.html", "/about/"]
];

const entities = {
    "&amp;": "&", "&quot;": "\"", "&#39;": "'", "&apos;": "'",
    "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–",
    "&rsquo;": "’", "&lsquo;": "‘", "&rdquo;": "”", "&ldquo;": "“"
};

function textOnly(value) {
    return value
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&(?:amp|quot|#39|apos|lt|gt|nbsp|mdash|ndash|rsquo|lsquo|rdquo|ldquo);/g, entity => entities[entity] || entity)
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/\s+/g, " ")
        .trim();
}

const index = pages.map(([filename, url]) => {
    let html = fs.readFileSync(path.join(root, filename), "utf8");
    const title = textOnly((html.match(/<title>([\s\S]*?)<\/title>/i) || [null, filename])[1]);
    html = html
        .replace(/^---[\s\S]*?---\s*/, "")
        .replace(/<(script|style|svg|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ");

    const chunks = [...html.matchAll(/<(?:h1|h2|h3|p|li)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|p|li)>/gi)]
        .map(match => textOnly(match[1]))
        .filter(text => text.length >= 18 && text.length <= 700)
        .filter((text, position, all) => all.indexOf(text) === position);

    return { title, url, chunks };
});

const output = `/* Generated from the website's public pages. Run: node scripts/build-agent-site-index.cjs */\nwindow.RefugeeAgentSiteIndex = Object.freeze(${JSON.stringify(index, null, 2)});\n`;
fs.writeFileSync(path.join(root, "refugee-agent-site-index.js"), output);
console.log(`Indexed ${index.length} pages and ${index.reduce((sum, page) => sum + page.chunks.length, 0)} content sections.`);

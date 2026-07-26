const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const siteOrigin = "https://ishaantejthotapalli.github.io/Help-The-Refugees-official-site";
const ignored = new Set(["404.html", "google6d27a65a364f9328.html"]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if ([".git", "help-the-refugees-handoff"].includes(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const htmlFiles = walk(root).filter(file => file.endsWith(".html"));
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const errors = [];

for (const file of htmlFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (ignored.has(relative)) continue;
  const html = fs.readFileSync(file, "utf8");
  const headEnd = html.indexOf("</head>");
  const head = headEnd >= 0 ? html.slice(0, headEnd) : "";
  const body = headEnd >= 0 ? html.slice(headEnd + 7) : html;
  const titleCount = (head.match(/<title>/gi) || []).length;
  const descriptions = [...head.matchAll(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/gi)];
  const canonicals = [...head.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/gi)];

  if (titleCount !== 1) errors.push(`${relative}: expected one title in head, found ${titleCount}`);
  if (descriptions.length !== 1) errors.push(`${relative}: expected one meta description`);
  if (canonicals.length !== 1) errors.push(`${relative}: expected one canonical URL`);
  if (canonicals[0] && !canonicals[0][1].startsWith(siteOrigin)) errors.push(`${relative}: canonical uses the wrong origin`);
  if (canonicals[0] && !sitemap.includes(`<loc>${canonicals[0][1]}</loc>`)) errors.push(`${relative}: canonical is missing from sitemap`);
  if (/<(?:html|head|title|meta\s+charset)\b/i.test(body)) errors.push(`${relative}: document metadata appears inside body`);

  for (const match of head.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${relative}: invalid JSON-LD (${error.message})`); }
  }

  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (!match[1].trim()) continue;
    try { new Function(match[1]); } catch (error) { errors.push(`${relative}: invalid inline JavaScript (${error.message})`); }
  }

  for (const match of html.matchAll(/href=["']([^"'#?]+)["']/gi)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
    const target = path.resolve(path.dirname(file), href);
    const candidates = href.endsWith("/") ? [path.join(target, "index.html")] : [target, `${target}.html`, path.join(target, "index.html")];
    if (!candidates.some(candidate => fs.existsSync(candidate))) errors.push(`${relative}: broken internal link ${href}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`SEO checks passed for ${htmlFiles.length - ignored.size} indexable HTML pages.`);

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const statePath = path.join(root, "data", "extra-concepts.json");
const landingPath = path.join(root, "more-info", "extra-concepts.html");
const articlesDir = path.join(root, "more-info", "extra-concepts");
const siteUrl = "https://ishaantejthotapalli.github.io/Help-The-Refugees-official-site";
const recipient = process.env.EXTRA_CONCEPTS_RECIPIENT || "ishaantejthotapalli@gmail.com";
const action = process.argv[2];
const choice = Number(process.argv[3] || process.env.IDEA_CHOICE);

function readState() {
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function extractResponseText(response) {
  if (response.output_text) return response.output_text;
  return (response.output || []).flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text).join("\n");
}

function parseJson(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function askResearchModel(prompt) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      tools: [{ type: "web_search_preview" }],
      input: prompt
    })
  });
  if (!response.ok) throw new Error(`Research API failed (${response.status}): ${await response.text()}`);
  return extractResponseText(await response.json());
}

async function sendEmail(subject, html) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is required");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EXTRA_CONCEPTS_FROM || "Help The Refugees <onboarding@resend.dev>",
      to: [recipient],
      subject,
      html
    })
  });
  if (!response.ok) throw new Error(`Email API failed (${response.status}): ${await response.text()}`);
  console.log(`Email sent to ${recipient}: ${subject}`);
}

function siteTopics() {
  const ignored = new Set(["404.html", "google6d27a65a364f9328.html"]);
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if ([".git", "help-the-refugees-handoff", "extra-concepts"].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name.endsWith(".html") && !ignored.has(entry.name)) files.push(absolute);
    }
  }
  walk(root);
  return files.map(file => {
    const html = fs.readFileSync(file, "utf8");
    const title = html.match(/<title>(.*?)<\/title>/is)?.[1] || "";
    const headings = [...html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gis)].map(match => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    return `${path.relative(root, file)}: ${[title, ...headings].join(" | ")}`;
  }).join("\n").slice(0, 16000);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

async function generateIdeas() {
  const prompt = `You are the editorial researcher for a child-friendly refugee education website. Review the existing coverage below, then research current authoritative sources (UNHCR, IOM, UNICEF, UN agencies, governments, universities, or established humanitarian organizations). Propose exactly four educational concepts that are either genuinely uncovered or substantially deeper than current coverage. Avoid breaking news, party politics, graphic detail, fundraising claims, and duplicate topics. Return ONLY valid JSON as {"ideas":[{"title":"...","angle":"...","whyItMatters":"...","sources":[{"title":"...","url":"https://..."}]}]}. Each idea needs 2-3 authoritative source URLs.\n\nEXISTING COVERAGE:\n${siteTopics()}`;
  const result = parseJson(await askResearchModel(prompt));
  if (!Array.isArray(result.ideas) || result.ideas.length !== 4) throw new Error("The research model did not return exactly four ideas");
  const state = readState();
  state.ideas = result.ideas;
  state.ideaWeek = new Date().toISOString();
  state.selected = null;
  state.researchNotes = [];
  writeState(state);
  const rows = state.ideas.map((idea, index) => `<h3>${index + 1}. ${escapeHtml(idea.title)}</h3><p>${escapeHtml(idea.angle)}</p><p><strong>Why it matters:</strong> ${escapeHtml(idea.whyItMatters)}</p>`).join("");
  await sendEmail("Choose this week's Extra Concept", `<h2>Four new Extra Concepts</h2>${rows}<p>Open the repository’s <strong>Extra Concepts Research</strong> workflow, choose <strong>Run workflow</strong>, select <strong>select</strong>, and enter idea number 1–4.</p>`);
}

async function selectIdea() {
  const state = readState();
  if (!Number.isInteger(choice) || choice < 1 || choice > state.ideas.length) throw new Error("IDEA_CHOICE must be a valid idea number");
  state.selected = { ...state.ideas[choice - 1], number: choice, selectedAt: new Date().toISOString() };
  state.researchNotes = [];
  writeState(state);
  await research();
  await sendEmail(`Research started: ${state.selected.title}`, `<p>Your selection was recorded and its first research pass is complete.</p><p><strong>${escapeHtml(state.selected.title)}</strong></p><p>The system will deepen the research each day and prepare the page on Friday.</p>`);
}

async function research() {
  const state = readState();
  if (!state.selected) { console.log("No selected idea; research skipped."); return; }
  const prior = state.researchNotes.map(note => note.summary).join("\n").slice(-10000);
  const prompt = `Research this child-friendly educational topic using current authoritative primary sources. Find useful facts and explanations not already in the prior notes. Do not invent facts. Return ONLY valid JSON as {"summary":"400-700 words of research notes","facts":[{"claim":"...","sourceTitle":"...","sourceUrl":"https://..."}]}. Every factual claim must have a source URL. Topic: ${state.selected.title}. Angle: ${state.selected.angle}. Prior notes: ${prior || "None"}`;
  const note = parseJson(await askResearchModel(prompt));
  state.researchNotes.push({ researchedAt: new Date().toISOString(), ...note });
  writeState(state);
  console.log(`Research pass ${state.researchNotes.length} saved.`);
}

function articleTemplate(article, slug) {
  const sections = article.sections.map(section => `<section class="content-section"><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("")}</section>`).join("\n");
  const sources = article.sources.map(source => `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`).join("");
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${escapeHtml(article.title)} | Help The Refugees</title>\n<meta name="description" content="${escapeHtml(article.description)}">\n<meta name="robots" content="index, follow">\n<link rel="canonical" href="${siteUrl}/more-info/extra-concepts/${slug}.html">\n<link rel="stylesheet" href="../../style.css">\n<link rel="icon" href="../../images/logo.png">\n</head>\n<body>\n<div id="progress-bar"></div>\n<header><nav class="navbar"><div class="nav-left"><a href="../../index.html" class="logo"><img src="../../images/logo.png" alt="Help The Refugees Logo"><span>Help The Refugees</span></a></div><ul class="nav-links"><li><a href="../../index.html">Home</a></li><li><a href="../extra-concepts.html">Extra Concepts</a></li><li><a href="../../feedback.html">Feedback</a></li></ul><div class="menu-toggle">☰</div></nav></header>\n<main class="page-content"><section class="content-section"><p><a href="../extra-concepts.html">← All Extra Concepts</a></p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.introduction)}</p></section>${sections}<section class="content-section"><h2>Sources and further reading</h2><ul>${sources}</ul><p><em>Educational summary published ${new Date().toISOString().slice(0, 10)}. Sources were reviewed during the week of publication.</em></p></section></main>\n<script src="../../script.js"></script>\n</body>\n</html>\n`;
}

async function publish() {
  const state = readState();
  if (!state.selected || !state.researchNotes.length) { console.log("Nothing selected or researched; publish skipped."); return; }
  const prompt = `Create a clear, compassionate, child-friendly educational article from the source-backed research below. Never add unsupported facts. Return ONLY valid JSON as {"title":"...","description":"140-160 characters","introduction":"...","sections":[{"heading":"...","paragraphs":["...","..."]}],"sources":[{"title":"...","url":"https://..."}]}. Use 4-6 sections and plain language for ages 11+. Research: ${JSON.stringify(state.researchNotes).slice(0, 50000)}`;
  const article = parseJson(await askResearchModel(prompt));
  const slug = slugify(article.title);
  fs.mkdirSync(articlesDir, { recursive: true });
  fs.writeFileSync(path.join(articlesDir, `${slug}.html`), articleTemplate(article, slug));
  state.published.unshift({ title: article.title, description: article.description, slug, publishedAt: new Date().toISOString() });
  state.selected = null;
  state.researchNotes = [];
  writeState(state);
  updateLanding(state);
  addArticleToSitemap(slug);
  await sendEmail(`Published: ${article.title}`, `<p>The new Extra Concept is ready:</p><p><a href="${siteUrl}/more-info/extra-concepts/${slug}.html">${escapeHtml(article.title)}</a></p>`);
}

function updateLanding(state) {
  const html = fs.readFileSync(landingPath, "utf8");
  const cards = state.published.length ? state.published.map(item => `<article class="info-card"><h2><a href="extra-concepts/${escapeHtml(item.slug)}.html">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.description)}</p><a class="button" href="extra-concepts/${escapeHtml(item.slug)}.html">Read concept</a></article>`).join("\n") : `<p class="empty-state">The first researched concept will appear here after Friday’s editorial run.</p>`;
  const updated = html.replace(/<!-- GENERATED_CONCEPTS_START -->[\s\S]*<!-- GENERATED_CONCEPTS_END -->/, `<!-- GENERATED_CONCEPTS_START -->\n${cards}\n<!-- GENERATED_CONCEPTS_END -->`);
  fs.writeFileSync(landingPath, updated);
}

function addArticleToSitemap(slug) {
  const sitemapPath = path.join(root, "sitemap.xml");
  const url = `${siteUrl}/more-info/extra-concepts/${slug}.html`;
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  if (sitemap.includes(`<loc>${url}</loc>`)) return;
  const entry = `  <url><loc>${url}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n`;
  fs.writeFileSync(sitemapPath, sitemap.replace("</urlset>", `${entry}</urlset>`));
}

async function emailTest() {
  await sendEmail("Help The Refugees automation test", "<h2>Email connection successful</h2><p>The Extra Concepts research system can send its Sunday ideas to this address.</p>");
}

const commands = { ideas: generateIdeas, select: selectIdea, research, publish, "email-test": emailTest };
if (!commands[action]) throw new Error("Use: ideas, select, research, publish, or email-test");
await commands[action]();

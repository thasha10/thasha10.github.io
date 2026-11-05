// Builds the whole site into ./dist from the markdown files in ./posts.
// Run with:  npm run build
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const DIR = process.cwd();
const OUT = path.join(DIR, "dist");
const read = p => fs.readFileSync(path.join(DIR, p), "utf8");
const json = p => JSON.parse(read(p));
const write = (rel, data) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, data);
};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

fs.rmSync(OUT, { recursive: true, force: true });
const site = json("site.json");
const i18n = json("src/i18n.json");
const about = json("data/about.json");
const tagList = json("data/tags.json");
const CATS = i18n.cats;
const bi = (en, ta) => `<span data-l="en">${en}</span><span data-l="ta">${ta}</span>`;
const T = k => bi(esc(i18n.ui.en[k]), esc(i18n.ui.ta[k]));
const SITE_URL = (site.url || "").replace(/\/$/, "");

const tags = {};
for (const t of tagList) tags[String(t.key).trim().toLowerCase()] = { en: t.en || t.key, ta: t.ta || t.en || t.key };

/* ---------------- Read posts ---------------- */
const today = new Intl.DateTimeFormat("en-CA", { timeZone: site.timezone || "Asia/Colombo" }).format(new Date());
const warnings = [];
let posts = [];

const stripMd = s => s
  .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
  .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/<[^>]+>/g, "")
  .replace(/[#>*_`]/g, "");

function makeExcerpt(body, poem) {
  const lines = stripMd(body).split("\n").map(l => l.trim()).filter(Boolean);
  if (poem) return lines.slice(0, 2).join("\n");
  const first = lines[0] || "";
  if (first.length <= 190) return first;
  return first.slice(0, 190).replace(/\s+\S*$/, "") + "…";
}

for (const file of fs.readdirSync(path.join(DIR, "posts")).filter(f => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "").trim().replace(/\s+/g, "-");
  const { data, content } = matter(read("posts/" + file));
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || "").slice(0, 10);
  if (!data.title) { warnings.push(`${file}: no title, skipped`); continue; }
  if (!CATS[data.category]) { warnings.push(`${file}: unknown category "${data.category}", skipped`); continue; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { warnings.push(`${file}: missing or invalid date, skipped`); continue; }
  if (data.draft === true) continue;           // kept as a draft
  if (date > today) continue;                   // scheduled for later
  const lang = data.lang === "ta" ? "ta" : "en";
  const poem = data.category === "poetry";
  const html = marked.parse(content, { gfm: true, breaks: poem });
  posts.push({
    slug, lang, date, cat: data.category, poem,
    title: String(data.title),
    tags: (Array.isArray(data.tags) ? data.tags : []).map(t => String(t).trim().toLowerCase()).filter(Boolean),
    key: data.translationKey ? String(data.translationKey).trim() : null,
    cover: data.cover ? String(data.cover).replace(/^\//, "") : null,
    excerpt: data.excerpt ? String(data.excerpt).trim() : makeExcerpt(content, poem),
    html,
    text: stripMd(content).replace(/\s+/g, " ").trim().toLowerCase().slice(0, 4000)
  });
}
posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
for (const p of posts) {
  p.url = `posts/${p.slug}/`;
  p.alt = p.key ? posts.find(o => o !== p && o.key === p.key && o.lang !== p.lang) || null : null;
}

/* ---------------- Page shell ---------------- */
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Noto+Serif+Tamil:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;500;600&family=Source+Sans+3:wght@400;500;600&display=swap";

const ROSE_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="rose-svg" viewBox="0 0 48 48"><path d="M24 7C14 7 8 15 10 26c2 10 10 14 16 14 8 0 14-8 12-18-2-8-8-12-14-10-6 2-8 10-4 16 3 4 9 2 9-3 0-4-4-6-6-4"/><path d="M25 40c0 4-1 6-2 8M24 44c-4-1-7-3-8-6 4 0 7 2 8 6z"/></symbol></svg>`;

function header(root) {
  const links = [
    ["home", root, T("home")],
    ...Object.keys(CATS).map(k => [`cat:${k}`, `${root}category/?c=${k}`, bi(esc(CATS[k].en), esc(CATS[k].ta))]),
    ["about", `${root}about/`, T("about")]
  ].map(([n, href, label]) => `<a href="${href}" data-nav="${n}">${label}</a>`).join("");
  return `<header class="top">
  <div class="top-in">
    <a class="brand" href="${root}" aria-label="Home"><svg class="rose"><use href="#rose-svg"/></svg><span>${T("brand")}</span></a>
    <nav class="menu" id="menu" aria-label="Main">${links}</nav>
    <div class="controls">
      <div class="seg" role="group" aria-label="Language">
        <button type="button" data-lang="en" aria-pressed="true">EN</button>
        <button type="button" data-lang="ta" aria-pressed="false" lang="ta">தமிழ்</button>
      </div>
      <button class="icon-btn" id="searchBtn" type="button" aria-label="Search" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></button>
      <button class="icon-btn" id="themeBtn" type="button" aria-label="Switch light or dark">
        <svg class="moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>
        <svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>
      </button>
    </div>
  </div>
  <form class="searchbar" id="searchbar" role="search" action="${root}search/" method="get">
    <div class="top-in" style="grid-template-columns:1fr"><input id="q" name="q" type="search" autocomplete="off" aria-label="Search"></div>
  </form>
</header>`;
}

function footer() {
  return `<footer>
  <span>© ${new Date().getFullYear()} ${T("brand")}</span>
  <nav aria-label="Social"><a href="${esc(site.facebook)}" target="_blank" rel="noopener">Facebook</a><a href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram</a></nav>
</footer>`;
}

function shell({ title, desc, root, body, pageType, bodyAttrs = "", forceLang = "", og = {} }) {
  const early = `<script>try{var d=document.documentElement,l=localStorage.getItem('lang'),t=localStorage.getItem('theme');if(l==='ta'||l==='en')d.lang=l;if(t==='light'||t==='dark')d.dataset.theme=t;}catch(e){}${forceLang ? `document.documentElement.lang='${forceLang}';` : ""}</script>`;
  const ogTags = [
    ["og:title", og.title || title], ["og:description", desc], ["og:type", og.type || "website"],
    og.url && ["og:url", og.url], og.image && ["og:image", og.image],
    ["twitter:card", og.image ? "summary_large_image" : "summary"]
  ].filter(Boolean).map(([k, v]) => `<meta property="${k}" content="${esc(v)}">`).join("\n");
  const gc = site.goatcounter ? `<script data-goatcounter="https://${esc(site.goatcounter)}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>` : "";
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark" data-root="${root}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${ogTags}
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="${root}style.css">
${early}
</head>
<body data-page="${pageType}" ${bodyAttrs}>
<div id="progress" aria-hidden="true"></div>
${ROSE_DEFS}
${header(root)}
${body}
${footer()}
<script>window.I18N=${JSON.stringify(i18n)};window.SITE=${JSON.stringify({ goatcounter: site.goatcounter || "", cusdis: site.cusdis || "" })};</script>
<script src="${root}app.js"></script>
${gc}
</body>
</html>
`;
}

const brandName = { en: i18n.ui.en.brand, ta: i18n.ui.ta.brand };
const fmtDate = (d, lang) => new Intl.DateTimeFormat(lang === "ta" ? "ta" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d + "T00:00:00"));
const fixPaths = (html, root) => html.replace(/(src|href)="\/(?!\/)/g, `$1="${root}`);

/* ---------------- Post pages ---------------- */
function postPage(p, i, list) {
  const root = "../../";
  const same = list.filter(o => o.lang === p.lang);
  const idx = same.indexOf(p);
  const older = same[idx + 1], newer = same[idx - 1];
  const ui = i18n.ui[p.lang];
  const canonical = `${SITE_URL}/${p.url}`;
  const cover = p.cover
    ? `<div class="cover"><img src="${root}${esc(p.cover)}" alt=""></div>`
    : `<div class="cover"><div class="art art-${p.cat}"></div><div class="mark"><svg class="rose"><use href="#rose-svg"/></svg></div></div>`;
  const pn = (o, label) => o ? `<a href="${root}${o.url}"><small>${esc(label)}</small><span>${esc(o.title)}</span></a>` : "<span></span>";
  const comments = site.cusdis
    ? `<section class="comments"><h2>${esc(ui.comments)}</h2><div id="cusdis_thread" data-host="https://cusdis.com" data-app-id="${esc(site.cusdis)}" data-page-id="${esc(p.slug)}" data-page-url="${esc(canonical)}" data-page-title="${esc(p.title)}"></div></section>`
    : "";
  const body = `<main id="main"><article class="post">
    ${cover}
    <div class="kicker"><a class="cat" href="${root}category/?c=${p.cat}">${esc(CATS[p.cat][p.lang])}</a><span>${esc(fmtDate(p.date, p.lang))}</span>${p.alt ? '<span class="lang-chip">EN · தமிழ்</span>' : ""}</div>
    <h1>${esc(p.title)}</h1>
    ${p.alt ? `<a class="also read" href="${root}${p.alt.url}" data-switch="${p.alt.lang}">${esc(ui.alsoOther)}</a>` : ""}
    <div class="body ${p.poem ? "poetry" : ""}">${fixPaths(p.html, root)}</div>
    <div class="post-tags"><div class="tags">${p.tags.map(k => `<a href="${root}tag/?k=${encodeURIComponent(k)}">${esc((tags[k] || { [p.lang]: k })[p.lang])}</a>`).join("")}</div></div>
    <div class="stats">
      <span class="reads" id="reads" hidden><strong id="readsN"></strong> ${esc(ui.reads)}</span>
      <span class="grow"></span>
      <div class="share" id="share"></div>
    </div>
    <nav class="pn" aria-label="Posts">${pn(older, ui.prev)}${pn(newer, ui.next)}</nav>
    ${comments}
  </article></main>`;
  const og = { title: `${p.title} — ${brandName[p.lang]}`, type: "article", url: canonical, image: p.cover ? `${SITE_URL}/${p.cover}` : undefined };
  write(`${p.url}index.html`, shell({
    title: `${p.title} — ${brandName[p.lang]}`, desc: p.excerpt.replace(/\n/g, " "), root, body, pageType: "post",
    bodyAttrs: `data-lang="${p.lang}" data-alt="${p.alt ? p.alt.url : ""}" data-title="${esc(p.title)}" data-nav="cat:${p.cat}"`,
    forceLang: p.lang, og
  }));
}

/* ---------------- Other pages ---------------- */
const dyn = (root, noscript = "") => `<main id="main">${noscript}</main>`;
const listNoscript = root => `<noscript><ul>${posts.map(p => `<li><a href="${root}${p.url}">${esc(p.title)}</a></li>`).join("")}</ul></noscript>`;
const siteDesc = "Short stories, musings, poetry and translations in English and Tamil.";

write("index.html", shell({ title: `${brandName.en} — ${brandName.ta}`, desc: siteDesc, root: "./", body: dyn("./", listNoscript("./")), pageType: "home" }));
write("category/index.html", shell({ title: brandName.en, desc: siteDesc, root: "../", body: dyn("../", listNoscript("../")), pageType: "category" }));
write("tag/index.html", shell({ title: brandName.en, desc: siteDesc, root: "../", body: dyn("../", listNoscript("../")), pageType: "tag" }));
write("search/index.html", shell({ title: brandName.en, desc: siteDesc, root: "../", body: dyn("../"), pageType: "search" }));

const paras = s => String(s || "").split(/\n\n+/).map(x => `<p>${esc(x).replace(/\n/g, "<br>")}</p>`).join("");
write("about/index.html", shell({
  title: `About — ${brandName.en}`, desc: siteDesc, root: "../", pageType: "static", bodyAttrs: 'data-nav="about"',
  body: `<main id="main"><div class="page-head"><h1>${T("about")}</h1></div>
    <div class="about-body"><div data-l="en">${paras(about.en)}</div><div data-l="ta">${paras(about.ta)}</div></div></main>`
}));
write("404.html", shell({
  title: `Not found — ${brandName.en}`, desc: siteDesc, root: "/", pageType: "static",
  body: `<main id="main"><div class="page-head"><h1>404</h1><p>${T("notFound")}</p></div><div class="empty"><a class="read" href="/">${T("backHome")}</a></div></main>`
}));

posts.forEach((p, i, list) => postPage(p, i, list));

/* ---------------- Data, assets ---------------- */
write("posts.json", JSON.stringify({
  cats: CATS, tags,
  posts: posts.map(p => ({ slug: p.slug, url: p.url, lang: p.lang, key: p.key, pair: !!p.alt, title: p.title, excerpt: p.excerpt, cat: p.cat, tags: p.tags, date: p.date, cover: p.cover, poem: p.poem }))
}));
write("search.json", JSON.stringify(Object.fromEntries(posts.map(p => [p.slug, p.text]))));

const base = read("src/style.base.css");
const extra = read("src/style.extra.css");
write("style.css", base + "\n" + extra);
write("app.js", read("src/app.js"));
write("favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#C2314D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 7C14 7 8 15 10 26c2 10 10 14 16 14 8 0 14-8 12-18-2-8-8-12-14-10-6 2-8 10-4 16 3 4 9 2 9-3 0-4-4-6-6-4"/><path d="M25 40c0 4-1 6-2 8M24 44c-4-1-7-3-8-6 4 0 7 2 8 6z"/></svg>`);
if (fs.existsSync(path.join(DIR, "media"))) fs.cpSync(path.join(DIR, "media"), path.join(OUT, "media"), { recursive: true });

console.log(`Built ${posts.length} posts (today in ${site.timezone}: ${today}).`);
for (const w of warnings) console.warn("WARNING: " + w);

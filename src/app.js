/* Front-end for the blog: language + theme switches, lists, search, post-page extras.
   The post pages themselves are generated at build time (see build.mjs). */
(function () {
  "use strict";
  const D = document, html = D.documentElement;
  const R = html.dataset.root || "./";
  const I = window.I18N, SITE = window.SITE || {};
  const page = D.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const PAGE_SIZE = 12;
  let lang = html.lang === "ta" ? "ta" : "en";
  let DATA = null, SEARCH = null, shown = PAGE_SIZE;

  const $ = s => D.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const UI = () => I.ui[lang];
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const rose = () => '<svg class="rose" aria-hidden="true"><use href="#rose-svg"/></svg>';
  const fmtDate = d => new Intl.DateTimeFormat(lang === "ta" ? "ta" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d + "T00:00:00"));
  const count = n => n + " " + (n === 1 ? UI().post : UI().posts);
  const tagName = k => (DATA.tags[k] && DATA.tags[k][lang]) || k;
  const visible = () => DATA.posts.filter(p => p.lang === lang);

  /* ---------- Language ---------- */
  function setLang(l) {
    lang = l; html.lang = l; store("lang", l);
    D.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    $("#q").placeholder = UI().searchPh;
    $("#searchBtn").setAttribute("aria-label", UI().search);
  }

  /* ---------- Views (home, category, tag, search) ---------- */
  function cover(p) {
    if (p.cover) return `<div class="cover"><img src="${R}${esc(p.cover)}" alt=""></div>`;
    return `<div class="cover"><div class="art art-${p.cat}"></div><div class="mark">${rose()}</div></div>`;
  }
  function kicker(p) {
    return `<div class="kicker"><a class="cat" href="${R}category/?c=${p.cat}">${esc(DATA.cats[p.cat][lang])}</a><span>${esc(fmtDate(p.date))}</span>${p.pair ? '<span class="lang-chip">EN · தமிழ்</span>' : ""}</div>`;
  }
  function entry(p) {
    return `<article class="entry">${kicker(p)}<h3><a href="${R}${p.url}">${esc(p.title)}</a></h3><p class="${p.poem ? "poem" : ""}">${esc(p.excerpt)}</p></article>`;
  }
  function more(total, rest) {
    return rest > shown ? `<div class="more"><button class="btn" id="loadMore">${esc(UI().loadMore)}</button></div>` : "";
  }
  function homeView() {
    const list = visible();
    if (!list.length) return `<div class="empty">${rose()}${esc(UI().none)}</div>`;
    const [f, ...rest] = list;
    const tagKeys = [...new Set(list.flatMap(p => p.tags))];
    return `
      <section class="hero" aria-label="${esc(UI().latest)}">
        <div>
          ${kicker(f)}
          <h1 style="margin-top:18px"><a href="${R}${f.url}">${esc(f.title)}</a></h1>
          <p style="${f.poem ? "white-space:pre-line;font-style:italic" : ""}">${esc(f.excerpt)}</p>
          <a class="read" href="${R}${f.url}">${esc(UI().read)}</a>
        </div>
        <a href="${R}${f.url}" aria-hidden="true" tabindex="-1">${cover(f)}</a>
      </section>
      ${rest.length ? `<div class="rule">${rose()}</div><h2 class="section-title">${esc(UI().latest)}</h2>
      <div class="entries">${rest.slice(0, shown).map(entry).join("")}</div>${more(list.length, rest.length)}` : ""}
      ${tagKeys.length ? `<div class="rule">${rose()}</div><h2 class="section-title">${esc(UI().tags)}</h2>
      <div class="tags">${tagKeys.map(k => `<a href="${R}tag/?k=${encodeURIComponent(k)}">${esc(tagName(k))}</a>`).join("")}</div>` : ""}`;
  }
  function listing(title, list) {
    return `<div class="page-head"><h1>${esc(title)}</h1><p>${esc(count(list.length))}</p></div>
      ${list.length ? `<div class="entries" style="margin-top:28px">${list.slice(0, shown).map(entry).join("")}</div>${more(list.length, list.length)}`
        : `<div class="empty">${rose()}${esc(UI().none)}</div>`}`;
  }

  let docTitle = "";
  function render() {
    if (!DATA || page === "post" || page === "static") return;
    let out = "";
    if (page === "category") {
      const c = params.get("c");
      if (DATA.cats[c]) { docTitle = DATA.cats[c][lang]; out = listing(docTitle, visible().filter(p => p.cat === c)); }
      else out = homeView();
    } else if (page === "tag") {
      const k = (params.get("k") || "").toLowerCase();
      docTitle = "# " + tagName(k);
      out = listing(docTitle, visible().filter(p => p.tags.includes(k)));
    } else if (page === "search") {
      const q = (params.get("q") || "").trim();
      const needle = q.toLowerCase();
      const hit = p => ((p.title + " " + p.excerpt + " " + p.tags.map(tagName).join(" ") + " " + ((SEARCH && SEARCH[p.slug]) || "")).toLowerCase()).includes(needle);
      docTitle = UI().results + ": " + q;
      out = listing(docTitle, needle ? visible().filter(hit) : []);
    } else {
      out = homeView();
    }
    $("#main").innerHTML = out;
    if (docTitle) D.title = docTitle + " — " + UI().brand;
    markNav();
  }

  function markNav() {
    let cur = D.body.dataset.nav || "";
    if (page === "home") cur = "home";
    if (page === "category") cur = "cat:" + (params.get("c") || "");
    D.querySelectorAll(".menu a").forEach(a => {
      if (a.dataset.nav === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  /* ---------- Post page extras ---------- */
  function setupPost() {
    const title = D.body.dataset.title || D.title;
    const url = location.href.split("#")[0];
    const u = encodeURIComponent(url), t = encodeURIComponent(title);
    const share = $("#share");
    if (share) {
      share.innerHTML = esc(UI().share) + ": " +
        `<a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a> ` +
        `<a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener">WhatsApp</a> ` +
        `<a href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener">X</a> ` +
        `<a href="https://www.threads.net/intent/post?text=${t}%20${u}" target="_blank" rel="noopener">Threads</a> ` +
        `<button type="button" id="copyBtn">${esc(UI().copy)}</button>` +
        (navigator.share ? ` <button type="button" id="moreBtn">${esc(UI().more)}</button>` : "");
    }
    // Reader count (GoatCounter)
    if (SITE.goatcounter) {
      fetch(`https://${SITE.goatcounter}.goatcounter.com/counter/${encodeURIComponent(location.pathname)}.json`)
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then(j => { $("#readsN").textContent = j.count; $("#reads").hidden = false; })
        .catch(() => {});
    }
    // Comments (Cusdis)
    const thread = $("#cusdis_thread");
    if (thread && SITE.cusdis) {
      thread.dataset.theme = html.dataset.theme === "light" ? "light" : "dark";
      const s = D.createElement("script");
      s.async = true; s.defer = true; s.src = "https://cusdis.com/js/cusdis.es.js";
      D.body.appendChild(s);
    }
    // Reading progress bar
    const bar = $("#progress"), art = $(".post");
    function progress() {
      const start = art.offsetTop, end = art.offsetTop + art.offsetHeight - window.innerHeight;
      const pct = end > start ? Math.min(1, Math.max(0, (window.scrollY - start) / (end - start))) : 1;
      bar.style.width = pct * 100 + "%";
    }
    window.addEventListener("scroll", progress, { passive: true });
    window.addEventListener("resize", progress);
    progress();
  }

  /* ---------- Events ---------- */
  D.addEventListener("click", e => {
    const lb = e.target.closest("[data-lang]");
    if (lb) {
      const l = lb.dataset.lang;
      setLang(l);
      if (page === "post") {
        const alt = D.body.dataset.alt;
        location.href = l === D.body.dataset.lang ? location.href : (alt ? R + alt : R);
      } else { shown = PAGE_SIZE; render(); }
      return;
    }
    const sw = e.target.closest("[data-switch]");
    if (sw) store("lang", sw.dataset.switch);          // let the link navigate
    if (e.target.id === "loadMore") { shown += PAGE_SIZE; render(); }
    if (e.target.id === "copyBtn") {
      const b = e.target;
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(
        () => { b.textContent = UI().copied; setTimeout(() => (b.textContent = UI().copy), 1600); }, () => {});
    }
    if (e.target.id === "moreBtn") {
      navigator.share({ title: D.body.dataset.title, url: location.href.split("#")[0] }).catch(() => {});
    }
  });

  $("#themeBtn").addEventListener("click", () => {
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next; store("theme", next);
    try { if (window.CUSDIS && window.CUSDIS.setTheme) window.CUSDIS.setTheme(next); } catch (_) {}
  });

  const bar = $("#searchbar"), q = $("#q"), sBtn = $("#searchBtn");
  sBtn.addEventListener("click", () => {
    const open = bar.classList.toggle("open");
    sBtn.setAttribute("aria-expanded", String(open));
    if (open) q.focus();
  });
  q.addEventListener("input", () => {
    if (page !== "search") return;                       // elsewhere, Enter opens the results page
    const v = q.value.trim();
    history.replaceState(null, "", v ? "?q=" + encodeURIComponent(v) : location.pathname);
    params.set("q", v); render();
  });
  q.addEventListener("keydown", e => {
    if (e.key === "Escape") { bar.classList.remove("open"); sBtn.setAttribute("aria-expanded", "false"); sBtn.focus(); }
  });

  /* ---------- Start ---------- */
  setLang(lang);
  if (page === "post") {
    store("lang", D.body.dataset.lang);                   // the page's own language wins
    setLang(D.body.dataset.lang);
    setupPost();
    markNav();
  } else if (page === "static") {
    markNav();
  } else {
    if (page === "search") { bar.classList.add("open"); sBtn.setAttribute("aria-expanded", "true"); q.value = params.get("q") || ""; }
    const jobs = [fetch(R + "posts.json").then(r => r.json())];
    if (page === "search") jobs.push(fetch(R + "search.json").then(r => r.json()));
    Promise.all(jobs).then(([d, s]) => { DATA = d; SEARCH = s || null; render(); });
  }
})();

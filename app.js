const LOCK_INSPECT =
  typeof LOCK_INSPECT_ENV !== "undefined" ? LOCK_INSPECT_ENV : false;

if (LOCK_INSPECT) {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      ["u", "s", "a"].includes(e.key.toLowerCase())
    )
      e.preventDefault();
    if (e.key === "F12") e.preventDefault();
  });
}

const HP_DISTRICTS = [
  'Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu',
  'Lahaul-Spiti','Mandi','Shimla','Sirmaur','Solan','Una'
];

let db = null;
function getDb() {
  if (!db)
    db = window._db.createClient(
      window.DB_URL || DB_URL,
      window.DB_KEY || DB_KEY,
    );
  return db;
}

function maybeShowWelcome() {
  if (sessionStorage.getItem("ds_welcomed")) return;
  sessionStorage.setItem("ds_welcomed", "1");
  const identity = getReporterIdentity();
  const g = identity.name ? identity.name + ", " : "";
  const msgs = [
    t("toasts.welcome1", { name: g }),
    t("toasts.welcome2", { name: g }),
    t("toasts.welcome3"),
    t("toasts.welcome4", { name: g }),
  ];
  setTimeout(() => {
    Toastify({
      text: msgs[Math.floor(Math.random() * msgs.length)],
      duration: 3500,
      gravity: "bottom",
      position: "center",
      stopOnFocus: true,
      style: {
        background: "var(--s1)",
        border: "1px solid var(--gn)",
        color: "var(--tx)",
        fontFamily: "'DM Sans',sans-serif",
        fontSize: ".8rem",
        letterSpacing: ".2px",
        borderRadius: "8px",
        padding: ".65rem 1.1rem",
        boxShadow: "var(--sh)",
      },
    }).showToast();
  }, 700);
}

function toast(msg, err) {
  Toastify({
    text: msg,
    duration: err ? 4000 : 3000,
    gravity: "bottom",
    position: "center",
    style: {
      background: err ? "var(--pk10)" : "var(--s1)",
      border: err ? "1px solid var(--pk)" : "1px solid var(--gn)",
      color: err ? "var(--pk)" : "var(--tx)",
      fontFamily: "'DM Sans',sans-serif",
      fontSize: ".8rem",
      borderRadius: "8px",
      boxShadow: "var(--sh)",
    },
  }).showToast();
}

const ICONS = {
  bin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c0 0-4 4-4 8a4 4 0 008 0c0-2-1-4-1-4s-1 3-3 3-2-2-2-2 2-1 2-5z"/></svg>`,
  drop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3L5 14a7 7 0 0014 0L12 3z"/></svg>`,
  brick: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="5" rx="1"/><rect x="2" y="12" width="9" height="5" rx="1"/><rect x="13" y="12" width="9" height="5" rx="1"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="2" width="6" height="20" rx="1"/><rect x="2" y="9" width="20" height="6" rx="1"/></svg>`,
  bone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="9" cy="4.5" rx="1.8" ry="2.2"/><ellipse cx="15" cy="4.5" rx="1.8" ry="2.2"/><ellipse cx="5.5" cy="9.5" rx="1.5" ry="1.8"/><ellipse cx="18.5" cy="9.5" rx="1.5" ry="1.8"/><path d="M12 22c-2.8 0-6-2.5-6-6 0-2 1.5-3.5 3-4.5 1-.7 2-1 3-1s2 .3 3 1c1.5 1 3 2.5 3 4.5 0 3.5-3.2 6-6 6z"/></svg>`,
  photo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
  rock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 17l3-5 4 2 3-7 4 4 6-3v9H2z"/><path d="M7 12l2-3 3 2"/></svg>`,
  tent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3L2 20h20L12 3z"/><path d="M12 3v17"/><path d="M8 20l4-6 4 6"/></svg>`,
};

const CATS = [
  { key: "Plastic waste", icon: "bin", label: "Plastic" },
  { key: "Food waste", icon: "bin", label: "Food waste" },
  { key: "Construction", icon: "brick", label: "Debris" },
  { key: "Nala / Sewage", icon: "drop", label: "Nala / Sewage" },
  { key: "Burning garbage", icon: "flame", label: "Burning" },
  { key: "E-waste", icon: "bolt", label: "E-waste" },
  { key: "Medical waste", icon: "cross", label: "Medical" },
  { key: "Animal waste", icon: "bone", label: "Animal" },
  { key: "Mixed / general", icon: "bin", label: "Mixed" },
  { key: "Landslide debris", icon: "rock", label: "Landslide" },
  { key: "Tourist litter", icon: "tent", label: "Tourist litter" },
];

function catIcon(key) {
  const c = CATS.find((x) => x.key === key);
  return c ? ICONS[c.icon] : ICONS.bin;
}
function pinIcon(cats) {
  return !cats || !cats.length ? ICONS.bin : catIcon(cats[0]);
}

function genId() {
  const d = new Date();
  const dt = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const tm = `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const r = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `DS-${dt}-${tm}-${r}`;
}

function fmtTs(iso) {
  const d = new Date(iso);
  const locale = getUiLocale();
  const localDate = d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const localTime = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isIST = viewerTz === "Asia/Calcutta" || viewerTz === "Asia/Kolkata";
  if (isIST) {
    return localDate + " · " + localTime + " IST";
  }
  const istTime = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  return localDate + " · " + localTime + " [" + istTime + " IST]";
}

function normLocation(str) {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function looksLikeAbbr(str) {
  const s = (str || "").trim();
  return /^[A-Z0-9&-]{2,5}$/.test(s);
}

let reports = [],
  map,
  mLayer,
  detMap = null,
  curView = "map",
  prevPage = "pg-feed";
const PAGES = ["pg-feed", "pg-detail", "pg-report", "pg-karma"];

function goPage(id, from) {
  PAGES.forEach((p) => document.getElementById(p).classList.remove("on"));
  document.querySelectorAll(".ntab").forEach((t) => t.classList.remove("on"));
  document.querySelectorAll(".bnav-btn").forEach((b) => b.classList.remove("on"));
  document.getElementById(id).classList.add("on");
  if (id === "pg-feed") {
    document.getElementById("ntab-feed").classList.add("on");
    const bf = document.getElementById("bnav-feed"); if (bf) bf.classList.add("on");
  }
  if (id === "pg-report") {
    document.getElementById("ntab-report").classList.add("on");
    const br = document.getElementById("bnav-report"); if (br) br.classList.add("on");
  }
  if (id === "pg-karma") {
    const nk = document.getElementById("ntab-karma"); if (nk) nk.classList.add("on");
    const bk = document.getElementById("bnav-karma"); if (bk) bk.classList.add("on");
    renderKarmaPanel();
  }
  if (from) prevPage = from;
  if (id === "pg-feed" && map) setTimeout(() => map.invalidateSize(), 80);
  window.scrollTo(0, 0);
}
function goBack() {
  goPage(prevPage || "pg-feed");
}
function openDetail(id) {
  const r = reports.find((x) => x.id === id);
  if (!r) return;
  currentDetailId = id;
  prevPage = "pg-feed";
  renderDetail(r);
  goPage("pg-detail");
}

async function fetchReports() {
  setFeedLoading(true);
  try {
    const { data, error } = await getDb()
      .from("reports")
      .select("*, report_photos(url, position)")
      .order("ts", { ascending: false })
      .range(0, 199);
    if (error) throw error;
    reports = data.map((r) => ({
      ...r,
      photos: (r.report_photos || [])
        .sort((a, b) => a.position - b.position)
        .map((p) => p.url),
    }));
  } catch (e) {
    toast(
      t("toasts.loadReports"),
      true,
    );
    reports = [];
  }
  setFeedLoading(false);
  buildDistrictFilter();
  applyFilters();
}

function setFeedLoading(on) {
  const el = document.getElementById("feed-loading");
  if (el) el.style.display = on ? "flex" : "none";
}

function initMap() {
  map = L.map("map", { zoomControl: true, scrollWheelZoom: true }).setView(
    [31.95, 77.10],
    8,
  );
  map.setMaxBounds([[29.5, 74.5], [34.0, 80.0]]);
  map.options.minZoom = 7;
  mainTileLayer = createTileLayer().addTo(map);
  mLayer = L.layerGroup().addTo(map);
  buildDistrictFilter();
  buildCatFilter();
  fetchReports();
}

/* locateUser removed — map always centers on HP */

function makePinIcon(cats) {
  return L.divIcon({
    className: "",
    html: `<div class="dpin">${pinIcon(cats)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function renderMarkers(data) {
  mLayer.clearLayers();
  data.forEach((r) => {
    const m = L.marker([r.lat, r.lng], { icon: makePinIcon(r.cats) }).addTo(
      mLayer,
    );
    m.bindPopup(buildPopHTML(r), { maxWidth: 260, minWidth: 210 });
    m.on("popupopen", () => {
      const btn = document.getElementById("pu-btn-" + r.id);
      if (btn) btn.onclick = () => openDetail(r.id);
    });
  });
}

function buildPopHTML(r) {
  const imgEl =
    r.photos && r.photos.length
      ? `<div class="pu-img"><img src="${r.photos[0]}"></div>`
      : `<div class="pu-img">${ICONS.photo}</div>`;
  const cats = (r.cats || [])
    .map((c) => `<span class="pu-cat">${catIcon(c)}<span>${translateCategory(c)}</span></span>`)
    .join("");
  const districtLabel = r.district ? r.district + (r.area && r.area !== r.district ? ', ' + r.area : '') : r.area;
  const badge = getReporterBadgeHTML(r.reporter);
  return `<div>${imgEl}<div class="pu-body"><div class="pu-loc">${r.specific}</div><div class="pu-area">${districtLabel}, ${r.state}</div>${cats ? `<div class="pu-cats">${cats}</div>` : ""}${r.notes ? `<div style="font-size:.72rem;color:var(--mu);margin-top:.28rem;line-height:1.4;">${r.notes}</div>` : ""}<div class="pu-meta"><span class="pu-by">${reporterByline(r.reporter)}${badge}</span><span class="pu-date">${fmtTs(r.ts)}</span></div><button class="pu-link" id="pu-btn-${r.id}">${t("feed.viewFull")}</button></div></div>`;
}

function getReporterBadgeHTML(name) {
  if (!name || !reports.length) return '';
  const count = reports.filter(r => r.reporter === name).length;
  const level = getReporterLevel(count);
  if (!level) return '';
  return ' <span class="reporter-badge">' + level.emoji + ' ' + level.title + '</span>';
}

function sevClass(sev) {
  if (!sev || !sev.length) return "sev-none";
  const s = sev[0].toLowerCase();
  if (s.includes("block")) return "sev-blocking";
  if (s.includes("severe")) return "sev-severe";
  if (s.includes("moderate")) return "sev-moderate";
  return "sev-minor";
}

function groupByTime(data) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yestStart = new Date(todayStart - 86400000);
  const weekStart = new Date(todayStart - 6 * 86400000);
  const groups = { today: [], yesterday: [], thisWeek: [], older: {} };
  data.forEach((r) => {
    const d = new Date(r.ts);
    if (d >= todayStart) groups.today.push(r);
    else if (d >= yestStart) groups.yesterday.push(r);
    else if (d >= weekStart) groups.thisWeek.push(r);
    else {
      const key = d.toLocaleDateString(getUiLocale(), {
        month: "long",
        year: "numeric",
      });
      if (!groups.older[key]) groups.older[key] = [];
      groups.older[key].push(r);
    }
  });
  return groups;
}

function renderLCard(r) {
  const sc = sevClass(r.sev);
  const chips = (r.cats || [])
    .map((c) => `<span class="chip">${catIcon(c)}<span>${translateCategory(c)}</span></span>`)
    .join("");
  const timeStr = new Date(r.ts).toLocaleTimeString(getUiLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `<div class="lcard ${sc}" onclick="openDetail('${r.id}')">
    <div class="lcard-main">
      <div class="lcard-loc"><span class="lcard-loc-inner">${r.specific}</span></div>
      <div class="lcard-area">${r.district ? r.district + (r.area && r.area !== r.district ? ', ' + r.area : '') : r.area}, ${r.state}</div>
      ${chips ? `<div class="lcard-chips">${chips}</div>` : ""}
    </div>
    <div class="lcard-meta">
      <span class="lcard-by">${reporterByline(r.reporter)}${getReporterBadgeHTML(r.reporter)}</span>
      <span class="lcard-time">${timeStr}</span>
    </div>
  </div>`;
}

function renderGroup(label, items, cls) {
  if (!items || !items.length) return "";
  const sorted = [...items].sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return `<div class="clist-group">
    <div class="clist-heading ${cls}">
      <span class="clist-heading-label">${label}</span>
      <span class="clist-heading-count">${formatReportCount(items.length)}</span>
    </div>
    ${sorted.map(renderLCard).join("")}
  </div>`;
}

function renderWall(data) {
  const el = document.getElementById("clist");
  if (!data.length) {
    el.innerHTML = `<div class="list-empty">${t("feed.noMatch")}</div>`;
    return;
  }
  const g = groupByTime(data);
  let html = "";
  if (g.today.length) html += renderGroup(t("feed.today"), g.today, "today");
  else if (g.yesterday.length)
    html += renderGroup(t("feed.yesterday"), g.yesterday, "yesterday");
  if (g.today.length && g.yesterday.length)
    html += renderGroup(t("feed.yesterday"), g.yesterday, "yesterday");
  if (g.thisWeek.length)
    html += renderGroup(t("feed.thisWeek"), g.thisWeek, "this-week");
  Object.keys(g.older)
    .sort((a, b) => new Date("01 " + b) - new Date("01 " + a))
    .forEach((k) => {
      html += renderGroup(k, g.older[k], "older");
    });
  el.innerHTML = html;
}

function buildDistrictFilter() {
  const el = document.getElementById("fs-district");
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">${t("feed.allDistricts")}</option>`;
  HP_DISTRICTS.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    el.appendChild(o);
  });
  if (current) el.value = current;
}

function populateDistrictDropdowns() {
  const formSel = document.getElementById("rdistrict");
  if (!formSel) return;
  const current = formSel.value;
  formSel.innerHTML = `<option value="">${t("form.selectDistrict")}</option>`;
  HP_DISTRICTS.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    formSel.appendChild(o);
  });
  if (current) formSel.value = current;
}

function buildCatFilter() {
  const el = document.getElementById("fs-cat");
  const current = el.value;
  el.innerHTML = `<option value="">${t("feed.allCategories")}</option>`;
  CATS.forEach((c) => {
    const o = document.createElement("option");
    o.value = c.key;
    o.textContent = translateCategory(c.key);
    el.appendChild(o);
  });
  if (current) el.value = current;
  document.getElementById("cgrid").innerHTML = CATS.map(
    (c) =>
      `<div class="ccard${selCats.includes(c.key) ? " on" : ""}" data-cat="${c.key}" onclick="toggleCat(this,'${c.key}')"><div class="ccard-ico">${ICONS[c.icon]}</div><div class="ccard-lbl">${translateCategory(c.key)}</div></div>`,
  ).join("");
}

function applyFilters() {
  const districtEl = document.getElementById("fs-district");
  const district = districtEl ? districtEl.value : "";
  const cat = document.getElementById("fs-cat").value;
  const areaEl = document.getElementById("fs-area");
  const prev = areaEl.value;
  areaEl.innerHTML = `<option value="">${t("feed.allAreas")}</option>`;
  [
    ...new Set(
      reports.filter((r) => !district || r.district === district).map((r) => r.area),
    ),
  ]
    .sort()
    .forEach((a) => {
      const o = document.createElement("option");
      o.value = a;
      o.textContent = a;
      areaEl.appendChild(o);
    });
  if (prev) areaEl.value = prev;
  const area = areaEl.value;
  const filtered = reports.filter((r) => {
    if (district && r.district !== district) return false;
    if (area && r.area !== area) return false;
    if (cat && !(r.cats || []).includes(cat)) return false;
    return true;
  });
  const n = filtered.length;
  document.getElementById("cnt-n").textContent = n;
  const sp = document.querySelector(".cnt span");
  if (sp) sp.textContent = n === 1 ? t("feed.spotsOne") : t("feed.spotsOther");
  renderMarkers(filtered);
  renderWall(filtered);
}

function setView(v) {
  curView = v;
  document.getElementById("map-wrap").style.display =
    v === "map" ? "flex" : "none";
  document.getElementById("list-wrap").classList.toggle("on", v === "list");
  document.getElementById("btn-map").classList.toggle("on", v === "map");
  document.getElementById("btn-list").classList.toggle("on", v === "list");
  if (v === "map" && map) setTimeout(() => map.invalidateSize(), 60);
}

function sizeViews() {
  const tb = document.querySelector(".toolbar");
  const h = window.innerHeight - 70 - (tb ? tb.offsetHeight : 40);
  const mw = document.getElementById("map-wrap");
  const lw = document.getElementById("list-wrap");
  if (mw) mw.style.height = h + "px";
  if (lw) lw.style.height = h + "px";
}

function renderDetail(r) {
  let photos = "";
  if (r.photos && r.photos.length) {
    const n = Math.min(r.photos.length, 6);
    const cls = ["", "n1", "n2", "n3", "n4", "n5", "n6"][n] || "n6";
    photos = `<div class="det-photos ${cls}">${r.photos
      .slice(0, 6)
      .map((p, i) => `<img class="det-photo dp${i}" src="${p}">`)
      .join("")}</div>`;
  } else {
    photos = `<div class="det-nophoto">${ICONS.photo}</div>`;
  }
  const cats = (r.cats || [])
    .map((c) => `<div class="det-cat">${catIcon(c)}<span>${translateCategory(c)}</span></div>`)
    .join("");
  const types = (r.type || [])
    .map((siteType) => `<span class="det-tag">${translateSiteType(siteType)}</span>`)
    .join("");
  const sevs = (r.sev || [])
    .map((severityValue) => `<span class="det-tag">${translateSeverity(severityValue)}</span>`)
    .join("");
  document.getElementById("det-content").innerHTML = `
    ${photos}
    <div class="det-id-badge">${t("detail.reportId")} <span>${r.id}</span></div>
    <div class="det-area">${r.district ? r.district : r.area}, ${r.state}${r.district && r.area && r.area !== r.district ? ' <span style="color:var(--mu);font-size:.75em;">&middot; ' + r.area + '</span>' : ''}</div>
    <div class="det-loc">${r.specific}</div>
    <div class="det-timestamp">${t("detail.submittedBy", { time: fmtTs(r.ts), name: r.reporter })}${getReporterBadgeHTML(r.reporter)}</div>
    <div class="form-grid" style="margin-top:1.25rem;">
      <div class="form-col">
        <div class="det-sec-label sl-loc" style="margin-bottom:.45rem;">${t("detail.location")}</div>
        <div style="font-family:var(--fb);font-size:.85rem;color:var(--gn);font-weight:500;">
          ${r.state} &middot; ${r.area}
          ${(!r.specific || r.specific === r.area) ? '<span style="font-size:0.65rem;font-weight:400;color:var(--mu);margin-left:6px;background:var(--s2);padding:2px 6px;border-radius:4px;">' + t("detail.approximateRegion") + '</span>' : ''}
        </div>
        ${r.gmaps_link ? `<div style="margin-top:.45rem;"><a href="${r.gmaps_link}" target="_blank" style="font-family:var(--fm);font-size:.65rem;color:var(--pk);text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>${t("detail.viewOnMaps")}</a></div>` : ''}
        ${r.notes ? `<div class="det-sec-label sl-loc" style="margin-top:1.1rem;margin-bottom:.45rem;">${t("detail.notes")}</div><div class="det-notes">${r.notes}</div>` : ""}
      </div>
      <div class="form-col">
        ${types ? `<div class="det-sec-label sl-site" style="margin-bottom:.45rem;">${t("detail.siteType")}</div><div class="det-tags" style="margin-bottom:.85rem;">${types}</div>` : ""}
        ${sevs ? `<div class="det-sec-label sl-sev" style="margin-bottom:.45rem;">${t("detail.severity")}</div><div class="det-tags">${sevs}</div>` : ""}
      </div>
      <div class="form-col">
        ${cats ? `<div class="det-sec-label sl-cat" style="margin-bottom:.45rem;">${t("detail.garbageCategory")}</div><div class="det-cats">${cats}</div>` : ""}
      </div>
    </div>`;
  const mm = document.getElementById("det-mini-map");
  mm.innerHTML = "";
  mm.style.display = "block";
  if (detMap) {
    try {
      detMap.remove();
    } catch (e) {}
    detMap = null;
  }
  setTimeout(() => {
    detMap = L.map("det-mini-map", {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
    }).setView([r.lat, r.lng], 14);
    detailTileLayer = createTileLayer().addTo(detMap);
    L.circle([r.lat, r.lng], {
      radius: 400,
      color: "#1B7A3D",
      fillColor: "#1B7A3D",
      fillOpacity: 0.08,
      weight: 1.5,
      opacity: 0.6,
    }).addTo(detMap);
    L.marker([r.lat, r.lng], { icon: makePinIcon(r.cats) }).addTo(detMap);
    detMap.invalidateSize();
  }, 80);

  // Upvote button
  const upWrap = document.getElementById('det-upvote-wrap');
  if (upWrap) {
    const upvotes = getUpvotes();
    const already = !!upvotes[r.id];
    upWrap.innerHTML = '<button class="upvote-btn' + (already ? ' upvoted' : '') + '" id="upvote-' + r.id + '" onclick="upvoteReport(\'' + r.id + '\')">' +
      (already ? t("detail.upvoted") : t("detail.upvote")) + '</button>';
  }
}

let locTimer = null,
  locLat = null,
  locLng = null;

function onLocInput(val) {
  clearTimeout(locTimer);
  const box = document.getElementById("loc-results");
  if (val.length < 3) {
    box.classList.remove("open");
    box.innerHTML = "";
    return;
  }
  box.innerHTML = '<div class="loc-searching">' + t("feed.searching") + '</div>';
  box.classList.add("open");
  locTimer = setTimeout(() => searchLoc(val), 500);
}

async function searchLoc(q) {
  const box = document.getElementById("loc-results");
  // HP bounding box: lat 30.22–33.27, lon 75.57–79.04
  const viewbox = "75.57,30.22,79.04,33.27";
  try {
    // Try Nominatim with viewbox bounds (not text scoping) — finds colonies better
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&viewbox=${viewbox}&bounded=1&accept-language=en`,
    );
    let data = await res.json();

    // If nothing found with bounded=1, try again without bounds but with HP text hint
    if (!data.length) {
      const res2 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", Himachal Pradesh")}&format=json&addressdetails=1&limit=5&accept-language=en`,
      );
      data = await res2.json();
    }

    // If still nothing, try Photon geocoder as last fallback
    if (!data.length) {
      try {
        const pRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=31.95&lon=77.10&limit=5&lang=en`
        );
        const pData = await pRes.json();
        if (pData.features && pData.features.length) {
          data = pData.features.map(f => ({
            display_name: [f.properties.name, f.properties.city || f.properties.county, f.properties.state].filter(Boolean).join(", "),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          }));
        }
      } catch (e) { /* Photon unavailable, skip */ }
    }

    if (!data.length) {
      box.innerHTML =
        '<div class="loc-searching">' + t("feed.noResults") + '</div>';
      return;
    }
    box.innerHTML = data
      .map(
        (item) =>
          `<div class="loc-result-item" onclick="pickLoc('${item.display_name.replace(/'/g, "\\'")}',${item.lat},${item.lon})">${item.display_name.split(",")[0]}<small>${item.display_name}</small></div>`,
      )
      .join("");
  } catch (e) {
    box.innerHTML =
      '<div class="loc-searching">' + t("feed.searchUnavailable") + '</div>';
  }
}

function pickLoc(name, lat, lng) {
  const parts = name
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const short = parts.slice(0, 2).join(", ");
  document.getElementById("rspec").value = short;
  locLat = parseFloat(lat);
  locLng = parseFloat(lng);
  const box = document.getElementById("loc-results");
  box.classList.remove("open");
  box.innerHTML = "";
  initPinMap(locLat, locLng);
}

function useMyLocation() {
  if (!navigator.geolocation) {
    toast(t("toasts.gpsUnavailable"), true);
    return;
  }
  const btn = document.querySelector(".loc-gps-btn");
  if (btn) { btn.textContent = t("form.locating"); btn.disabled = true; }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      locLat = lat;
      locLng = lng;
      // Reverse geocode to get a human-readable name
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`
        );
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(",").map(s => s.trim()).filter(Boolean);
          document.getElementById("rspec").value = parts.slice(0, 2).join(", ");
        } else {
          document.getElementById("rspec").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
      } catch (e) {
        document.getElementById("rspec").value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
      initPinMap(lat, lng);
      toast(t("toasts.gpsPinned"), false);
      if (btn) { btn.textContent = t("form.useMyLocation"); btn.disabled = false; }
    },
    (err) => {
      toast(t("toasts.gpsFailed"), true);
      if (btn) { btn.textContent = t("form.useMyLocation"); btn.disabled = false; }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function openGoogleMaps() {
  // If we have GPS coords, open Google Maps centered there for better context
  if (locLat && locLng) {
    window.open(`https://www.google.com/maps/@${locLat},${locLng},17z`, "_blank");
  } else {
    window.open("https://www.google.com/maps/@31.95,77.10,8z", "_blank");
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".loc-search-wrap")) {
    const box = document.getElementById("loc-results");
    if (box) box.classList.remove("open");
  }
});

const selTags = { type: [], sev: [] };
const selCats = [];

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tag").forEach((t) => {
    t.addEventListener("click", () => {
      const g = t.dataset.g;
      t.classList.toggle("on");
      const v = t.dataset.value || t.textContent.trim();
      if (t.classList.contains("on")) selTags[g].push(v);
      else selTags[g] = selTags[g].filter((x) => x !== v);
    });
  });
});

function toggleCat(el, key) {
  el.classList.toggle("on");
  if (el.classList.contains("on")) selCats.push(key);
  else {
    const i = selCats.indexOf(key);
    if (i > -1) selCats.splice(i, 1);
  }
}

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1280;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) =>
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
            }),
          ),
        "image/webp",
        0.82,
      );
    };
    img.src = url;
  });
}

const upFiles = [];
const flaggedImageIndices = new Set();

function initUpload() {
  const ua = document.getElementById("uparea"),
    ui = document.getElementById("photo-input");
  ua.addEventListener("dragover", (e) => {
    e.preventDefault();
    ua.classList.add("drag");
  });
  ua.addEventListener("dragleave", () => ua.classList.remove("drag"));
  ua.addEventListener("drop", (e) => {
    e.preventDefault();
    ua.classList.remove("drag");
    addFiles([...e.dataTransfer.files]);
  });
  ui.addEventListener("change", () => {
    addFiles([...ui.files]);
    ui.value = "";
  });
}

async function addFiles(fs) {
  const eligible = fs
    .filter((f) => f.type.startsWith("image/"))
    .slice(0, 6 - upFiles.length);
  for (const f of eligible) {
    const compressed = await compressImage(f);
    if (upFiles.length < 6) upFiles.push(compressed);
  }
  renderPreviews();
}

function renderPreviews() {
  const pg = document.getElementById("pgrid"),
    uc = document.getElementById("upcount"),
    ua = document.getElementById("uparea"),
    ui = document.getElementById("photo-input");
  pg.innerHTML = "";
  if (!upFiles.length) {
    pg.style.display = "none";
    uc.textContent = "";
    return;
  }
  pg.style.display = "grid";
  upFiles.forEach((f, i) => {
    const d = document.createElement("div");
    d.className = "pitem";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(f);
    const btn = document.createElement("button");
    btn.className = "prm";
    btn.textContent = "✕";
    btn.onclick = () => {
      upFiles.splice(i, 1);
      renderPreviews();
    };
    d.appendChild(img);
    d.appendChild(btn);
    pg.appendChild(d);
  });
  uc.textContent =
    upFiles.length > 1
      ? t("form.photoCountPlural", { count: upFiles.length })
      : t("form.photoCountSingular", { count: upFiles.length });
  const full = upFiles.length >= 6;
  ui.disabled = full;
  ua.style.opacity = full ? "0.5" : "1";
  ua.style.pointerEvents = full ? "none" : "";
}

async function submitReport() {
  const name = document.getElementById("rname").value.trim();
  const districtEl = document.getElementById("rdistrict");
  const district = districtEl ? districtEl.value : "";
  const state = "Himachal Pradesh";
  const area = normLocation(document.getElementById("rarea").value);
  const specific = normLocation(document.getElementById("rspec").value);
  const gmapsLink = document.getElementById("gmaps-link") ? document.getElementById("gmaps-link").value.trim() : "";
  
  if (!name || !district || !area) {
    toast(t("toasts.fillRequired"), true);
    return;
  }
  if (!upFiles.length) {
    toast(t("toasts.addPhoto"), true);
    return;
  }

  const notes = document.getElementById("rnotes").value.trim();
  const textErrors = checkTextSpam(name, state, area, specific, notes);
  if (textErrors.length > 0) {
    textErrors.forEach((msg) => toast(msg, true));
    return;
  }
  if (looksLikeAbbr(document.getElementById("rarea").value.trim()))
    toast(t("toasts.areaAbbr"), true);

  const btn = document.querySelector(".sub-btn");

  btn.textContent = t("form.checkingPhotos");
  btn.disabled = true;
  const imgResults = await checkAllImages(upFiles);
  const newFlags = imgResults.filter(
    (r) => !flaggedImageIndices.has(r.index - 1),
  );
  if (newFlags.length > 0) {
    newFlags.forEach((r) => {
      flaggedImageIndices.add(r.index - 1);
      toast(
        t("toasts.photoFlagged", {
          index: r.index,
          issue: r.issues[0],
        }),
        true,
      );
    });
    btn.textContent = t("form.submit");
    btn.disabled = false;
    return;
  }
  if (flaggedImageIndices.size > 0) {
    const stillFlagged = [...flaggedImageIndices].filter(
      (i) => i < upFiles.length,
    );
    if (stillFlagged.length > 0) {
      stillFlagged
        .slice()
        .reverse()
        .forEach((i) => {
          upFiles.splice(i, 1);
          flaggedImageIndices.delete(i);
        });
      renderPreviews();
      toast(t("toasts.flaggedRemoved"), false);
    }
  }
  if (!upFiles.length) {
    toast(t("toasts.noValidPhotos"), true);
    btn.textContent = t("form.submit");
    btn.disabled = false;
    return;
  }

  btn.textContent = t("form.uploading");
  try {
    const id = genId();
    const photoUrls = [];
    for (let i = 0; i < upFiles.length; i++) {
      const file = upFiles[i];
      const path = `${id}/${i + 1}.webp`;
      const { error: upErr } = await getDb()
        .storage.from("report-photos")
        .upload(path, file, { contentType: "image/webp", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = getDb()
        .storage.from("report-photos")
        .getPublicUrl(path);
      photoUrls.push({ url: urlData.publicUrl, position: i + 1 });
    }
    let resolvedLat = locLat;
    let resolvedLng = locLng;
    if (resolvedLat === null || resolvedLng === null) {
      const query = [specific, area, district, "Himachal Pradesh"].filter(Boolean).join(", ");
      try {
        const gRes = await fetch(
          "https://nominatim.openstreetmap.org/search?q=" +
            encodeURIComponent(query) +
            "&format=json&limit=1&accept-language=en",
        );
        const gData = await gRes.json();
        if (gData && gData.length) {
          resolvedLat = parseFloat(gData[0].lat);
          resolvedLng = parseFloat(gData[0].lon);
        }
      } catch (e) {}
    }
    if (resolvedLat === null || resolvedLng === null) {
      toast(t("toasts.coordsFailed"), true);
      btn.textContent = t("form.submit");
      btn.disabled = false;
      return;
    }
    
    // Auto-generate a GMaps link from coords if the user didn't paste one manually
    const finalGmapsLink = gmapsLink || `https://www.google.com/maps/place/${resolvedLat},${resolvedLng}`;
    
    if (!locLat || !locLng) initPinMap(resolvedLat, resolvedLng);
    const codes = getLocationCode(resolvedLat, resolvedLng);
    const { error: repErr } = await getDb()
      .from("reports")
      .insert({
        id,
        reporter: name,
        state,
        district,
        area,
        specific,
        type: selTags.type,
        cats: selCats,
        sev: selTags.sev,
        notes: document.getElementById("rnotes").value.trim(),
        lat: resolvedLat,
        lng: resolvedLng,
        digipin: codes.digipin || null,
        pluscode: codes.pluscode || null,
        gmaps_link: finalGmapsLink,
        ts: new Date().toISOString(),
      });
    if (repErr) throw repErr;
    const { error: photoErr } = await getDb()
      .from("report_photos")
      .insert(
        photoUrls.map((p) => ({
          report_id: id,
          url: p.url,
          position: p.position,
        })),
      );
    if (photoErr) throw photoErr;
    await fetchReports();
    saveReporterIdentity(name);
    const karmaResult = awardKarma(district);
    document.getElementById("form-screen").style.display = "none";
    document.getElementById("succ").classList.add("on");
    lastSuccessState = { id, karmaResult };
    renderSuccessState();
    window._lastReportId = id;
    window._lastReportSpecific = specific;
    window._lastReportDistrict = district;
  } catch (e) {
    const hint =
      e && String(e.message || "").includes("404")
        ? t("toasts.submit404Hint")
        : "";
    toast(
      t("toasts.submitFailed", {
        message: e.message || t("toasts.unknownError"),
        hint,
      }),
      true,
    );
    btn.textContent = t("form.submit");
    btn.disabled = false;
  }
}

function resetForm() {
  ["rname", "rarea", "rspec", "rnotes", "gmaps-link"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.querySelectorAll(".tag.on").forEach((t) => t.classList.remove("on"));
  document
    .querySelectorAll(".ccard.on")
    .forEach((c) => c.classList.remove("on"));
  Object.keys(selTags).forEach((k) => (selTags[k] = []));
  selCats.length = 0;
  upFiles.length = 0;
  locLat = null;
  locLng = null;
  flaggedImageIndices.clear();
  const pw = document.getElementById("pin-confirm-wrap");
  if (pw) pw.style.display = "none";
  if (pinMap) {
    try {
      pinMap.remove();
    } catch (e) {}
    pinMap = null;
    pinMarker = null;
  }
  renderPreviews();
  document.getElementById("form-screen").style.display = "";
  document.getElementById("succ").classList.remove("on");
  lastSuccessState = null;
  const btn = document.querySelector(".sub-btn");
  btn.textContent = t("form.submit");
  btn.disabled = false;
  const ua = document.getElementById("uparea"),
    ui = document.getElementById("photo-input");
  if (ui) ui.disabled = false;
  if (ua) {
    ua.style.opacity = "1";
    ua.style.pointerEvents = "";
  }
}

window.addEventListener("load", () => {
  const storedTheme = localStorage.getItem("ds_theme");
  const systemTheme =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  applyTheme(storedTheme || systemTheme, false);
  sizeViews();
  populateDistrictDropdowns();
  initMap();
  initUpload();
  prefillReporterName();
  autoDetectDistrict();
  applyLang();
  maybeShowWelcome();
});
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("ds_theme")) {
      applyTheme(e.matches ? "dark" : "light", false);
    }
  });
}
window.addEventListener("resize", sizeViews);
const DP_CHARS = "FCJ9RELEEBEMG8D7VT6KH5LNQP4SZ3Y2X1W0";

function encodeDigipin(lat, lng) {
  if (lat < 2.5 || lat > 38.5 || lng < 63.5 || lng > 99.5) return null;
  const ROWS = 4,
    COLS = 4;
  let minLat = 2.5,
    maxLat = 38.5,
    minLng = 63.5,
    maxLng = 99.5;
  let pin = "";
  for (let level = 0; level < 8; level++) {
    const dLat = (maxLat - minLat) / ROWS;
    const dLng = (maxLng - minLng) / COLS;
    const row = Math.min(ROWS - 1, Math.floor((lat - minLat) / dLat));
    const col = Math.min(COLS - 1, Math.floor((lng - minLng) / dLng));
    const gridRow = ROWS - 1 - row;
    const charIdx = gridRow * COLS + col;
    pin += DP_CHARS[charIdx];
    minLat = minLat + row * dLat;
    maxLat = minLat + dLat;
    minLng = minLng + col * dLng;
    maxLng = minLng + dLng;
    if (level === 2 || level === 5) pin += "-";
  }
  return pin;
}

function encodePlusCode(lat, lng) {
  try {
    const A = "23456789CFGHJMPQRVWX";
    const BASE = 20;
    lat = Math.max(-90, Math.min(90, lat));
    lng = Math.max(-180, Math.min(180, lng));
    if (lat === 90) lat -= 1e-7;
    const latV = Math.floor((lat + 90) * 8000);
    const lngV = Math.floor((lng + 180) * 8000);
    let latCode = "",
      lngCode = "";
    let av = latV,
      lv = lngV;
    for (let i = 0; i < 5; i++) {
      latCode = A[av % BASE] + latCode;
      av = Math.floor(av / BASE);
      lngCode = A[lv % BASE] + lngCode;
      lv = Math.floor(lv / BASE);
    }
    let code = "";
    for (let i = 0; i < 5; i++) code += latCode[i] + lngCode[i];
    return code.slice(0, 8) + "+" + code.slice(8, 13);
  } catch (e) {
    return null;
  }
}

function getLocationCode(lat, lng) {
  const dp = encodeDigipin(lat, lng);
  const pc = encodePlusCode(lat, lng);
  return { digipin: dp, pluscode: pc };
}

let pinMap = null,
  pinMarker = null,
  revGeoTimer = null;

function initPinMap(lat, lng) {
  const wrap = document.getElementById("pin-confirm-wrap");
  wrap.style.display = "block";
  if (pinMap) {
    try {
      pinMap.remove();
    } catch (e) {}
    pinMap = null;
    pinMarker = null;
  }
  setTimeout(() => {
    pinMap = L.map("pin-confirm-map", {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 16);
    pinTileLayer = createTileLayer().addTo(pinMap);
    const icon = L.divIcon({
      className: "",
      html: `<div class="dpin" style="cursor:grab;">${ICONS.drop}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
    pinMarker = L.marker([lat, lng], { icon, draggable: true }).addTo(pinMap);
    pinMarker.on("dragend", () => {
      const p = pinMarker.getLatLng();
      locLat = p.lat;
      locLng = p.lng;
      updatePinInfo(p.lat, p.lng);
    });
    pinMap.on("click", (e) => {
      pinMarker.setLatLng(e.latlng);
      locLat = e.latlng.lat;
      locLng = e.latlng.lng;
      updatePinInfo(e.latlng.lat, e.latlng.lng);
    });
    updatePinInfo(lat, lng);
    pinMap.invalidateSize();
  }, 80);
}

function updatePinInfo(lat, lng) {
  const codes = getLocationCode(lat, lng);
  const dpEl = document.getElementById("pin-digipin");
  if (dpEl) {
    const parts = [];
    if (codes.digipin) parts.push(t("form.digipin") + ": " + codes.digipin);
    if (codes.pluscode) parts.push(t("form.plusCode") + ": " + codes.pluscode);
    dpEl.textContent = parts.join("  ·  ");
  }
  clearTimeout(revGeoTimer);
  revGeoTimer = setTimeout(() => reverseGeocode(lat, lng), 600);
}

async function reverseGeocode(lat, lng) {
  const el = document.getElementById("pin-revgeo");
  if (!el) return;
  el.textContent = t("form.locating");
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/reverse?lat=" +
        lat +
        "&lon=" +
        lng +
        "&format=json&accept-language=en",
    );
    const d = await res.json();
    if (!d || !d.address) {
      el.textContent = "";
      return;
    }
    const a = d.address;
    const parts = [
      a.road || a.pedestrian || a.footway || a.path,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.county,
      a.state,
      a.country,
    ].filter(Boolean);
    const label = parts.length ? parts.slice(0, 4).join(", ") : "";
    el.textContent = label ? "📍 " + label : "";
    if (label) {
      const rspec = document.getElementById("rspec");
      if (rspec) rspec.value = normLocation(parts.slice(0, 2).join(", "));
    }
  } catch (e) {
    el.textContent = "";
  }
}

async function validateLocationField(val, fieldType) {
  if (!val || val.trim().length < 3) return;
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?q=" +
        encodeURIComponent(val.trim()) +
        "&format=json&addressdetails=1&limit=1&accept-language=en",
    );
    const data = await res.json();
    if (!data || !data.length) return;
    const a = data[0].address;
    if (fieldType === "state") {
      const isCity = !!(a.city || a.town || a.village || a.suburb);
      const isState = !!(a.state && !a.city && !a.town);
      if (isCity && !isState) {
        const stateHint = a.state
          ? t("toasts.stateHint", { value: a.state })
          : "";
        toast(
          t("toasts.stateLooksCity", {
            value: val.trim(),
            hint: stateHint,
          }),
          true,
        );
      }
    } else if (fieldType === "area") {
      const isState =
        !!a.state && !(a.city || a.town || a.village || a.suburb || a.county);
      if (isState) {
        const cityHint = a.county
          ? t("toasts.districtHint", { value: a.county })
          : "";
        toast(
          t("toasts.areaLooksState", {
            value: val.trim(),
            hint: cityHint,
          }),
          true,
        );
      }
    }
  } catch (e) {}
}

const ABUSE = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "rape",
  "raping",
  "raped",
  "molest",
  "ur mom",
  "your mom",
  "yo mama",
  "yo momma",
  "teri maa",
  "teri ma",
  "teri behen",
  "teri behan",
  "madarchod",
  "madarjaat",
  "bhenchod",
  "bhen ke",
  "bhenke",
  "behenchod",
  "chutiya",
  "chutiye",
  "chut",
  "lund",
  "gaand",
  "randi",
  "haramzada",
  "haramzadi",
  "haramkhor",
  "sala",
  "saala",
  "saali",
  "kamina",
  "kamine",
  "kaminey",
  "kutte",
  "kutiya",
  "mc",
  "bc",
  "mf",
  "stfu",
  "gtfo",
  "kys",
  "nsfw",
  "boobs",
  "tits",
  "naked",
  "nude",
  "porn",
  "sex",
  "sexy",
  "sexi",
  "horny",
  "boner",
  "lmao lmfao",
  "fake report",
  "nothing here",
  "bakwaas",
  "bekar",
  "faltu",
  "jhoot",
  "jhoothi",
  "jhootha",
  "bewakoof",
  "pagal",
  "ullu",
  "ulloo",
  "harami",
  "sala kutta",
  "suar",
  "suwar",
  "shiz",
  "shiit",
  "fuuk",
  "fuk",
  "fck",
  "azz",
  "a55",
  "b1tch",
  "fvck",
  "wtf",
  "wth",
  "shut up",
  "shutup",
  "idgaf",
  "idfc",
  "stfu",
  "gtfo",
  "kys",
  "tf",
  "bs",
  "pos",
  "nonsense",
  "rubbish",
  "this is stupid",
  "not real",
  "doesnt exist",
];

const GIBBERISH_PATTERNS = [
  /^(.)\1{3,}$/,
  /^[qwrtypsdfghjklzxcvbnm]{5,}$/i,
  /^[aeiou]{4,}$/i,
  /^(asdf|qwer|zxcv|hjkl|uiop|1234|abcd|wxyz)/i,
];

function containsAbuse(str) {
  if (!str) return null;
  const s = str
    .toLowerCase()
    .replace(/[*@#!$%^&]/g, "")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/4/g, "a");
  for (const w of ABUSE) {
    if (s.includes(w)) return w;
  }
  return null;
}

function isGibberish(str) {
  if (!str) return true;
  const s = str.trim();
  if (s.length <= 2) return true;
  for (const r of GIBBERISH_PATTERNS) {
    if (r.test(s)) return true;
  }
  const clean = s.toLowerCase().replace(/\s/g, "");
  if (clean.length > 6 && new Set(clean).size <= 2) return true;
  return false;
}

function checkTextSpam(name, state, area, specific, notes) {
  const errors = [];
  const required = [
    { label: t("labels.reporterName"), val: name },
    { label: t("labels.state"), val: state },
    { label: t("labels.area"), val: area },
  ];
  for (const f of required) {
    const abuse = containsAbuse(f.val);
    if (abuse) {
      errors.push(t("toasts.textInappropriate", { label: f.label }));
      continue;
    }
    if (isGibberish(f.val))
      errors.push(t("toasts.textUnreal", { label: f.label }));
  }
  if (specific) {
    const locationAbuse = containsAbuse(specific);
    if (locationAbuse) {
      errors.push(t("toasts.textInappropriate", { label: t("labels.location") }));
    } else if (isGibberish(specific)) {
      errors.push(t("toasts.textUnreal", { label: t("labels.location") }));
    }
  }
  if (notes) {
    const notesAbuse = containsAbuse(notes);
    if (notesAbuse) errors.push(t("toasts.textInappropriate", { label: t("labels.notes") }));
    const noteWords = notes.trim().split(/\s+/);
    const gibWords = noteWords.filter((w) => w.length > 2 && isGibberish(w));
    if (gibWords.length >= 1)
      errors.push(t("toasts.notesGibberish"));
  }
  return errors;
}

async function analyseImage(file) {
  return new Promise(function (resolve) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      const W = 80,
        H = 80;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      const total = W * H;

      const buckets = {};
      const greys = [];
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i],
          g = d[i + 1],
          b = d[i + 2];

        const grey = Math.round((r + g + b) / 3);
        greys.push(grey);
        const key =
          Math.round(r / 32) * 32 +
          "," +
          Math.round(g / 32) * 32 +
          "," +
          Math.round(b / 32) * 32;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const topBucket = Math.max.apply(null, Object.values(buckets));
      const dominance = topBucket / total;
      const mean =
        greys.reduce(function (a, b) {
          return a + b;
        }, 0) / greys.length;
      const variance =
        greys.reduce(function (a, v) {
          return a + Math.pow(v - mean, 2);
        }, 0) / greys.length;
      const issues = [];
      if (dominance > 0.75)
        issues.push(t("toasts.photoBlank"));
      if (variance < 100) issues.push(t("toasts.photoNoDetail"));
      const saturations = [];
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i],
          g = d[i + 1],
          b = d[i + 2];
        const mx = Math.max(r, g, b),
          mn = Math.min(r, g, b);
        saturations.push(mx === 0 ? 0 : (mx - mn) / mx);
      }
      const avgSat =
        saturations.reduce((a, b) => a + b, 0) / saturations.length;
      const highSatPx = saturations.filter((s) => s > 0.6).length / total;
      const veryHighSatPx = saturations.filter((s) => s > 0.85).length / total;
      const lowSatPx = saturations.filter((s) => s < 0.1).length / total;
      const isIllustration =
        (avgSat > 0.38 && highSatPx > 0.28 && variance > 300) ||
        (veryHighSatPx > 0.25 && lowSatPx > 0.3);
      if (isIllustration) {
        issues.push(t("toasts.photoIllustration"));
      }
      resolve({ ok: issues.length === 0, issues: issues });
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      resolve({ ok: true, issues: [] });
    };
    img.src = url;
  });
}

let faceApiReady = false;
async function loadFaceApi() {
  if (faceApiReady || typeof faceapi === "undefined") return false;
  try {
    await Promise.race([
      faceapi.nets.tinyFaceDetector.loadFromUri(
        "https://justadudewhohacks.github.io/face-api.js/models",
      ),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), 8000),
      ),
    ]);
    faceApiReady = true;
    return true;
  } catch (e) {
    console.warn("[DumpSpot] face-api models failed to load:", e.message);
    return false;
  }
}

async function checkFaceInImage(file) {
  if (typeof faceapi === "undefined") return { ok: true };
  const loaded = await loadFaceApi();
  if (!loaded) return { ok: true };
  try {
    const img = await faceapi.bufferToImage(file);
    const det = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.45 }),
    );
    if (det.length > 0)
      return {
        ok: false,
        issues: [t("toasts.photoPerson")],
      };
  } catch (e) {
    console.warn("[DumpSpot] face detection error:", e.message);
  }
  return { ok: true };
}

async function checkAllImages(files) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const analysis = await analyseImage(files[i]);
    const face = await checkFaceInImage(files[i]);
    const issues = analysis.issues.concat(face.issues || []);
    if (issues.length) results.push({ index: i + 1, issues: issues });
  }
  return results;
}

/* ═══════════════════════════════════════════════
   REPORTER IDENTITY (localStorage)
   ═══════════════════════════════════════════════ */
function getReporterIdentity() {
  try {
    const raw = localStorage.getItem("ds_reporter");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { id: null, name: "", totalReports: 0, totalKarma: 0, districts: [], firstAt: null, lastAt: null, log: [] };
}

function saveReporterIdentity(name) {
  const identity = getReporterIdentity();
  if (!identity.id) {
    identity.id = crypto.randomUUID ? crypto.randomUUID() : ("ds-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8));
  }
  if (name) identity.name = name;
  localStorage.setItem("ds_reporter", JSON.stringify(identity));
  return identity;
}

function prefillReporterName() {
  const identity = getReporterIdentity();
  if (identity.name) {
    const el = document.getElementById("rname");
    if (el && !el.value) el.value = identity.name;
  }
}

/* ═══════════════════════════════════════════════
   KARMA SYSTEM
   ═══════════════════════════════════════════════ */
const MILESTONES = [
  { count: 1,  title: "First Reporter",          emoji: "\uD83C\uDF31", points: 10 },
  { count: 5,  title: "Hill Guardian",            emoji: "\uD83C\uDFD4\uFE0F", points: 5 },
  { count: 10, title: "Devbhoomi Watchdog",       emoji: "\uD83D\uDC3E", points: 10 },
  { count: 25, title: "Clean Himachal Champion",   emoji: "\u2B50", points: 15 },
  { count: 50, title: "Pahadi Legend",             emoji: "\uD83D\uDC51", points: 25 },
];

function awardKarma(district) {
  const identity = getReporterIdentity();
  const now = new Date().toISOString();
  let points = 0;
  const labels = [];

  identity.totalReports = (identity.totalReports || 0) + 1;
  if (!identity.firstAt) identity.firstAt = now;

  // First report ever
  if (identity.totalReports === 1) {
    points += 10;
    labels.push("First eyes on the ground");
  } else {
    points += 5;
    labels.push("Another spot mapped");
  }

  // New district bonus
  if (!identity.districts) identity.districts = [];
  if (district && !identity.districts.includes(district)) {
    identity.districts.push(district);
    if (identity.districts.length > 1) {
      points += 3;
      labels.push("Expanding the map");
    }
  }

  // 3 reports in same district
  if (!identity.districtCounts) identity.districtCounts = {};
  if (district) {
    identity.districtCounts[district] = (identity.districtCounts[district] || 0) + 1;
    if (identity.districtCounts[district] === 3) {
      points += 3;
      labels.push("District watchdog");
    }
  }

  // Return after 7+ days
  if (identity.lastAt) {
    const daysSince = (Date.now() - new Date(identity.lastAt).getTime()) / 86400000;
    if (daysSince >= 7) {
      points += 2;
      labels.push("Still watching");
    }
  }

  // Milestone bonuses
  for (const m of MILESTONES) {
    if (identity.totalReports === m.count) {
      points += m.points;
      labels.push(m.emoji + " " + m.title);
    }
  }

  identity.totalKarma = (identity.totalKarma || 0) + points;
  identity.lastAt = now;

  // Weekly streak tracking
  if (!identity.streakWeeks) identity.streakWeeks = [];
  const weekNum = getWeekNumber(new Date());
  if (!identity.streakWeeks.includes(weekNum)) {
    identity.streakWeeks.push(weekNum);
    // Keep only last 52 weeks
    if (identity.streakWeeks.length > 52) identity.streakWeeks = identity.streakWeeks.slice(-52);
  }
  // Calculate current streak
  identity.currentStreak = calcStreak(identity.streakWeeks);

  // Log entry
  if (!identity.log) identity.log = [];
  identity.log.unshift({ points, labels, district, ts: now });
  if (identity.log.length > 50) identity.log = identity.log.slice(0, 50);

  localStorage.setItem("ds_reporter", JSON.stringify(identity));
  return { points, labels, total: identity.totalKarma };
}

/* ═══════════════════════════════════════════════
   KARMA PANEL RENDERING
   ═══════════════════════════════════════════════ */
function renderKarmaPanel() {
  const identity = getReporterIdentity();

  // Points
  const pointsEl = document.getElementById("karma-points");
  if (pointsEl) pointsEl.textContent = identity.totalKarma || 0;

  // Name
  const nameEl = document.getElementById("karma-name");
  if (nameEl)
    nameEl.textContent = identity.name
      ? identity.name
      : t("karma.anonymousReporter");

  // Milestones
  const msEl = document.getElementById("karma-milestones");
  if (msEl) {
    msEl.innerHTML = MILESTONES.map((m) => {
      const unlocked = (identity.totalReports || 0) >= m.count;
      return '<div class="km-card ' + (unlocked ? "km-unlocked" : "km-locked") + '">' +
        '<div class="km-emoji">' + m.emoji + '</div>' +
        '<div class="km-title">' + translateMilestoneTitle(m.title) + '</div>' +
        '<div class="km-req">' +
          (m.count > 1
            ? t("karma.unlockedReportsPlural", { count: m.count })
            : t("karma.unlockedReportsSingular", { count: m.count })) +
        '</div>' +
        '</div>';
    }).join("");
  }

  // Streak
  const streakHtml = '<div class="karma-streak">' +
    '<span class="streak-flame">\uD83D\uDD25</span> ' +
    '<span class="streak-num">' + (identity.currentStreak || 0) + '</span> ' +
    '<span class="streak-label">' + t("karma.weekStreak") + '</span>' +
    '</div>';
  const headerEl = document.querySelector('.karma-header');
  let existingStreak = document.querySelector('.karma-streak');
  if (existingStreak) existingStreak.remove();
  if (headerEl) headerEl.insertAdjacentHTML('beforeend', streakHtml);

  // Log
  const logEl = document.getElementById("karma-log");
  if (logEl) {
    if (!identity.log || !identity.log.length) {
      logEl.innerHTML = '<div class="kl-empty">' + t("karma.noActivity") + '</div>';
    } else {
      logEl.innerHTML = identity.log.slice(0, 10).map((entry) => {
        const d = new Date(entry.ts);
        const dateStr = d.toLocaleDateString(getUiLocale(), { day: "2-digit", month: "short" });
        return '<div class="kl-entry">' +
          '<div class="kl-points">+' + entry.points + '</div>' +
          '<div class="kl-info">' +
          '<div class="kl-labels">' + entry.labels.map(translateLogLabel).join(" \u00b7 ") + '</div>' +
          '<div class="kl-meta">' + (entry.district || "") + " \u00b7 " + dateStr + '</div>' +
          '</div></div>';
      }).join("");
    }
  }
}

/* ═══════════════════════════════════════════════
   WHATSAPP SHARE
   ═══════════════════════════════════════════════ */
function shareOnWhatsApp() {
  const specific = window._lastReportSpecific || (currentLang === "hi" ? "एक स्थान" : "a location");
  const district = window._lastReportDistrict || "Himachal Pradesh";
  const text = (currentLang === "hi"
    ? "मैंने DumpSpot HP पर " + specific + ", " + district + " में एक डम्प स्पॉट रिपोर्ट किया है। देवभूमि को साफ रखने में साथ दें — जो देखें, रिपोर्ट करें: "
    : "I just reported a dump spot at " + specific + ", " + district + " on DumpSpot HP! Help keep Devbhoomi clean — report what you see: ") +
    (location.origin || "https://dumpspot.hp");
  const url = "https://wa.me/?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

function renderSuccessState() {
  if (!lastSuccessState) return;
  document.getElementById("succ-id").textContent = t("success.id", { id: lastSuccessState.id });
  const karmaEl = document.getElementById("succ-karma");
  if (karmaEl && lastSuccessState.karmaResult.points > 0) {
    karmaEl.innerHTML =
      '<div class="karma-earned">' +
      t("success.karmaEarned", { points: lastSuccessState.karmaResult.points }) +
      '</div><div class="karma-earned-label">' +
      lastSuccessState.karmaResult.labels.map(translateLogLabel).join(" · ") +
      '</div>';
  } else if (karmaEl) {
    karmaEl.innerHTML = "";
  }
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   STREAK HELPERS
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function getWeekNumber(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start;
  const oneWeek = 604800000;
  return d.getFullYear() + '-W' + Math.ceil((diff / oneWeek) + 1);
}

function calcStreak(weeks) {
  if (!weeks || !weeks.length) return 0;
  const sorted = [...weeks].sort().reverse();
  const current = getWeekNumber(new Date());
  // Must include current or previous week
  if (sorted[0] !== current) {
    const prev = getWeekNumber(new Date(Date.now() - 604800000));
    if (sorted[0] !== prev) return 0;
  }
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    // Check if consecutive by checking they differ by 1 week
    const [y1, w1] = sorted[i-1].split('-W').map(Number);
    const [y2, w2] = sorted[i].split('-W').map(Number);
    if ((y1 === y2 && w1 - w2 === 1) || (y1 - y2 === 1 && w2 >= 52 && w1 === 1)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   GPS DISTRICT AUTO-DETECT
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function autoDetectDistrict() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        // Try to match district from response
        const possibleDistrict = addr.county || addr.state_district || addr.city || '';
        const match = HP_DISTRICTS.find(d =>
          possibleDistrict.toLowerCase().includes(d.toLowerCase()) ||
          d.toLowerCase().includes(possibleDistrict.toLowerCase())
        );
        if (match) {
          const sel = document.getElementById('rdistrict');
          if (sel && !sel.value) {
            sel.value = match;
            toast(t("toasts.districtAuto", { district: match }), false);
          }
        }
      }
    } catch (e) { /* silent fail */ }
  }, () => { /* permission denied — silent */ }, { timeout: 8000, maximumAge: 300000 });
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   REPORTER LEVEL BADGE
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function getReporterLevel(count) {
  if (count >= 50) return { title: translateLevelTitle("legend"), emoji: '\uD83D\uDC51' };
  if (count >= 25) return { title: translateLevelTitle("champion"), emoji: '\u2B50' };
  if (count >= 10) return { title: translateLevelTitle("watchdog"), emoji: '\uD83D\uDC3E' };
  if (count >= 5)  return { title: translateLevelTitle("guardian"), emoji: '\uD83C\uDFD4\uFE0F' };
  if (count >= 1)  return { title: translateLevelTitle("reporter"), emoji: '\uD83C\uDF31' };
  return null;
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   HINDI / ENGLISH TOGGLE
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
const TRANSLATIONS = {
  en: {
    brand: {
      subtitle: "DumpSpot · community reporting",
    },
    nav: {
      feed: "Feed",
      report: "+ Report",
      reportMobile: "Report",
      karma: "Karma",
      darkMode: "Dark",
      lightMode: "Light",
    },
    common: {
      optional: "optional",
    },
    feed: {
      filter: "Filter",
      allDistricts: "All districts",
      allAreas: "All areas",
      allCategories: "All categories",
      map: "Map",
      list: "List",
      spotsOne: "spot",
      spotsOther: "spots",
      loading: "Loading reports…",
      noMatch: "No spots match this filter.",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This week",
      viewFull: "View full report →",
      searching: "Searching…",
      noResults: "No results found. Try a nearby landmark or use GPS below.",
      searchUnavailable: "Search unavailable. Use GPS or type manually.",
      reportSingular: "{{count}} report",
      reportPlural: "{{count}} reports",
    },
    detail: {
      backToFeed: "Back to feed",
      reportId: "Report ID",
      submittedBy: "Submitted {{time}} · by {{name}}",
      location: "Location",
      approximateRegion: "Approximate Region",
      notes: "Notes",
      siteType: "Type of site",
      severity: "Severity",
      garbageCategory: "Garbage category",
      viewOnMaps: "View on Google Maps",
      upvote: "👁 I see this too",
      upvoted: "✔ Confirmed",
    },
    form: {
      intro: "See garbage piling up on your street? Drop a pin.<br>No login, no hassle — a name, a place, a photo.",
      name: "Your name",
      namePlaceholder: "What to call you",
      district: "District",
      area: "Area",
      selectDistrict: "Select district",
      areaPlaceholder: "Town / Area / Locality",
      specificLocation: "Specific location",
      specificPlaceholder: "e.g. Behind the old Shiv temple",
      gmapsPlaceholder: "Paste a Google Maps link (Optional)",
      locationHelp: "Can't find the exact spot on the map? Just describe it above or paste a link.",
      useMyLocation: "📍 Use my current location",
      findOnGoogleMaps: "Or find on Google Maps",
      dragPin: "Drag the pin to exact location",
      dragPinHint: "· tap map to move",
      siteType: "Type of site",
      severity: "Severity",
      garbageCategory: "Garbage category",
      notes: "Notes",
      notesPlaceholder: "Smell, duration, any hazard to public…",
      photos: "Photos",
      tapToAddPhotos: "Tap to add photos",
      photoFormats: "1 to 6 · JPG PNG WEBP",
      anonymousNote: "No account needed<br>anonymous beyond your name",
      submit: "Submit Report",
      checkingPhotos: "Checking photos…",
      uploading: "Uploading…",
      locating: "Locating…",
      digipin: "DigiPin",
      plusCode: "Plus Code",
      photoCountSingular: "{{count}}/6 photo",
      photoCountPlural: "{{count}}/6 photos",
    },
    success: {
      title: "Pinned.",
      subtitle: "Your report is live on the map.<br>Keep Devbhoomi clean — share it.",
      shareWhatsapp: "Share on WhatsApp",
      reportAnother: "Report another spot",
      id: "ID: {{id}}",
      karmaEarned: "+{{points}} karma",
    },
    karma: {
      points: "karma points",
      subtitle: "Your quiet impact on Devbhoomi",
      milestones: "Milestones",
      recentActivity: "Recent Activity",
      anonymousReporter: "Anonymous Reporter",
      weekStreak: "week streak",
      noActivity: "No activity yet. Submit your first report!",
      unlockedReportsSingular: "{{count}} report",
      unlockedReportsPlural: "{{count}} reports",
    },
    site: {
      road: "Road",
      footpath: "Footpath",
      nalaDrain: "Nala / Drain",
      openPlot: "Open plot",
      nearTemple: "Near temple",
      touristSpot: "Tourist spot",
      riverBank: "River / Nala bank",
      forestArea: "Forest area",
      market: "Market",
      nearSchool: "Near school",
      nearHospital: "Near hospital",
    },
    severity: {
      minor: "Minor",
      moderate: "Moderate",
      severe: "Severe",
      blockingRoad: "Blocking road",
    },
    categories: {
      "Plastic waste": "Plastic",
      "Food waste": "Food waste",
      Construction: "Debris",
      "Nala / Sewage": "Nala / Sewage",
      "Burning garbage": "Burning",
      "E-waste": "E-waste",
      "Medical waste": "Medical",
      "Animal waste": "Animal",
      "Mixed / general": "Mixed",
      "Landslide debris": "Landslide",
      "Tourist litter": "Tourist litter",
    },
    levels: {
      reporter: "Reporter",
      guardian: "Guardian",
      watchdog: "Watchdog",
      champion: "Champion",
      legend: "Pahadi Legend",
    },
    milestones: {
      firstReporter: "First Reporter",
      hillGuardian: "Hill Guardian",
      watchdog: "Devbhoomi Watchdog",
      champion: "Clean Himachal Champion",
      legend: "Pahadi Legend",
    },
    karmaLabels: {
      firstEyes: "First eyes on the ground",
      anotherSpot: "Another spot mapped",
      expandingMap: "Expanding the map",
      districtWatchdog: "District watchdog",
      stillWatching: "Still watching",
      keptWatch: "Kept watch on the ground",
      newDistrict: "Covered a new district",
      districtStreak: "3 reports in one district",
      verifiedSpot: "Verified a spot",
    },
    toasts: {
      welcome1: "{{name}}Pahadon ko saaf rakhein 🏔️",
      welcome2: "{{name}}Himachal is watching. Report what you see 📍",
      welcome3: "Every dump spot reported = one step closer to clean hills 💚",
      welcome4: "{{name}}Welcome back. Keep Devbhoomi clean 🌲",
      loadReports: "Could not load reports. Check Supabase tables, credentials, and connection.",
      gpsUnavailable: "GPS not available on this device",
      gpsPinned: "📍 Location pinned from GPS",
      gpsFailed: "Could not get location — check GPS permissions",
      fillRequired: "Fill in your name, district, and area.",
      addPhoto: "Add at least one photo.",
      areaAbbr: "Area looks like an abbreviation — write the full area name.",
      flaggedRemoved: "Flagged photos removed. Submitting remaining photos.",
      noValidPhotos: "No valid photos remaining. Please add at least one.",
      coordsFailed: "Could not determine approximate coordinates. Please provide a slightly more descriptive area.",
      submitFailed: "Submit failed: {{message}}{{hint}}",
      submit404Hint: " Check that reports and report_photos exist in Supabase.",
      unknownError: "unknown error",
      districtAuto: "District auto-detected: {{district}}",
      alreadyConfirmed: "You already confirmed this spot",
      confirmedSpot: "Spot confirmed — +2 karma for verification",
      stateHint: " Did you mean \"{{value}}\"?",
      districtHint: " Try a district like \"{{value}}\".",
      stateLooksCity: "State field: \"{{value}}\" looks like a city.{{hint}}",
      areaLooksState: "Area field: \"{{value}}\" looks like a state.{{hint}}",
      photoFlagged: "Photo {{index}}: {{issue}} — remove it or submit again to override.",
      photoBlank: "appears to be a blank or solid-colour image",
      photoNoDetail: "appears to have no real detail",
      photoIllustration: "photo looks like an illustration or artwork — please upload a real photo of the location",
      photoPerson: "photo appears to show a person — please upload a photo of the location, not people",
      textInappropriate: "{{label}} contains inappropriate language",
      textUnreal: "{{label}} does not look like a real value",
      notesGibberish: "notes appear to contain gibberish — please describe what you see clearly",
    },
    labels: {
      reporterName: "reporter name",
      state: "state",
      area: "area",
      location: "location",
      notes: "notes",
    },
  },
  hi: {
    brand: {
      subtitle: "डम्पस्पॉट · सामुदायिक रिपोर्टिंग",
    },
    nav: {
      feed: "फ़ीड",
      report: "+ रिपोर्ट",
      reportMobile: "रिपोर्ट",
      karma: "कर्म",
      darkMode: "डार्क",
      lightMode: "लाइट",
    },
    common: {
      optional: "वैकल्पिक",
    },
    feed: {
      filter: "फ़िल्टर",
      allDistricts: "सभी जिले",
      allAreas: "सभी क्षेत्र",
      allCategories: "सभी श्रेणियां",
      map: "मैप",
      list: "सूची",
      spotsOne: "स्थान",
      spotsOther: "स्थान",
      loading: "रिपोर्ट लोड हो रही हैं…",
      noMatch: "इस फ़िल्टर से कोई जगह नहीं मिली।",
      today: "आज",
      yesterday: "कल",
      thisWeek: "इस सप्ताह",
      viewFull: "पूरी रिपोर्ट देखें →",
      searching: "खोज जारी है…",
      noResults: "कोई नतीजा नहीं मिला। पास के किसी चिन्ह या GPS का उपयोग करें।",
      searchUnavailable: "खोज उपलब्ध नहीं है। GPS या मैनुअल एंट्री का उपयोग करें।",
      reportSingular: "{{count}} रिपोर्ट",
      reportPlural: "{{count}} रिपोर्ट",
    },
    detail: {
      backToFeed: "फ़ीड पर वापस",
      reportId: "रिपोर्ट आईडी",
      submittedBy: "{{time}} को भेजी गई · द्वारा {{name}}",
      location: "स्थान",
      approximateRegion: "अनुमानित क्षेत्र",
      notes: "टिप्पणी",
      siteType: "जगह का प्रकार",
      severity: "गंभीरता",
      garbageCategory: "कचरे की श्रेणी",
      viewOnMaps: "Google Maps पर देखें",
      upvote: "👁 मैं भी यह देख रहा हूँ",
      upvoted: "✔ पुष्टि की गई",
    },
    form: {
      intro: "क्या आपके आसपास कचरा जमा हो रहा है? एक पिन लगाइए।<br>कोई लॉगिन नहीं, कोई झंझट नहीं — बस नाम, जगह और फोटो।",
      name: "आपका नाम",
      namePlaceholder: "आपको क्या कहें",
      district: "जिला",
      area: "क्षेत्र",
      selectDistrict: "जिला चुनें",
      areaPlaceholder: "शहर / क्षेत्र / मोहल्ला",
      specificLocation: "सटीक स्थान",
      specificPlaceholder: "जैसे पुराने शिव मंदिर के पीछे",
      gmapsPlaceholder: "Google Maps लिंक पेस्ट करें (वैकल्पिक)",
      locationHelp: "मैप पर सटीक जगह नहीं मिल रही? ऊपर जगह लिखें या लिंक पेस्ट करें।",
      useMyLocation: "📍 मेरी मौजूदा लोकेशन उपयोग करें",
      findOnGoogleMaps: "या Google Maps पर खोजें",
      dragPin: "सटीक स्थान के लिए पिन खींचें",
      dragPinHint: "· हिलाने के लिए मैप टैप करें",
      siteType: "जगह का प्रकार",
      severity: "गंभीरता",
      garbageCategory: "कचरे की श्रेणी",
      notes: "टिप्पणी",
      notesPlaceholder: "बदबू, अवधि, या जनता के लिए कोई खतरा…",
      photos: "तस्वीरें",
      tapToAddPhotos: "फोटो जोड़ने के लिए टैप करें",
      photoFormats: "1 से 6 · JPG PNG WEBP",
      anonymousNote: "कोई अकाउंट नहीं चाहिए<br>आपके नाम से आगे यह गुमनाम है",
      submit: "रिपोर्ट भेजें",
      checkingPhotos: "फोटो जांची जा रही हैं…",
      uploading: "अपलोड हो रहा है…",
      locating: "लोकेशन ली जा रही है…",
      digipin: "डिजीपिन",
      plusCode: "प्लस कोड",
      photoCountSingular: "{{count}}/6 फोटो",
      photoCountPlural: "{{count}}/6 फोटो",
    },
    success: {
      title: "पिन हो गया।",
      subtitle: "आपकी रिपोर्ट अब मैप पर दिख रही है।<br>देवभूमि को साफ रखें — इसे साझा करें।",
      shareWhatsapp: "WhatsApp पर साझा करें",
      reportAnother: "एक और जगह रिपोर्ट करें",
      id: "आईडी: {{id}}",
      karmaEarned: "+{{points}} कर्म",
    },
    karma: {
      points: "कर्म अंक",
      subtitle: "देवभूमि पर आपका शांत असर",
      milestones: "उपलब्धियाँ",
      recentActivity: "हाल की गतिविधि",
      anonymousReporter: "गुमनाम रिपोर्टर",
      weekStreak: "सप्ताह स्ट्रीक",
      noActivity: "अभी कोई गतिविधि नहीं। अपनी पहली रिपोर्ट भेजें!",
      unlockedReportsSingular: "{{count}} रिपोर्ट",
      unlockedReportsPlural: "{{count}} रिपोर्ट",
    },
    site: {
      road: "सड़क",
      footpath: "फुटपाथ",
      nalaDrain: "नाला / ड्रेन",
      openPlot: "खाली प्लॉट",
      nearTemple: "मंदिर के पास",
      touristSpot: "पर्यटक स्थल",
      riverBank: "नदी / नाला किनारा",
      forestArea: "जंगल क्षेत्र",
      market: "बाज़ार",
      nearSchool: "स्कूल के पास",
      nearHospital: "अस्पताल के पास",
    },
    severity: {
      minor: "हल्का",
      moderate: "मध्यम",
      severe: "गंभीर",
      blockingRoad: "सड़क अवरुद्ध",
    },
    categories: {
      "Plastic waste": "प्लास्टिक",
      "Food waste": "खाद्य कचरा",
      Construction: "मलबा",
      "Nala / Sewage": "नाला / सीवेज",
      "Burning garbage": "जलता कचरा",
      "E-waste": "ई-कचरा",
      "Medical waste": "मेडिकल",
      "Animal waste": "पशु",
      "Mixed / general": "मिश्रित",
      "Landslide debris": "भूस्खलन",
      "Tourist litter": "पर्यटक कचरा",
    },
    levels: {
      reporter: "रिपोर्टर",
      guardian: "रक्षक",
      watchdog: "निगरानीकर्ता",
      champion: "चैंपियन",
      legend: "पहाड़ी लीजेंड",
    },
    milestones: {
      firstReporter: "पहला रिपोर्टर",
      hillGuardian: "पहाड़ी रक्षक",
      watchdog: "देवभूमि निगरानीकर्ता",
      champion: "क्लीन हिमाचल चैंपियन",
      legend: "पहाड़ी लीजेंड",
    },
    karmaLabels: {
      firstEyes: "जमीन पर पहली नज़र",
      anotherSpot: "एक और जगह दर्ज की",
      expandingMap: "मैप का दायरा बढ़ाया",
      districtWatchdog: "जिले की निगरानी की",
      stillWatching: "नज़र बनाए रखी",
      keptWatch: "जमीन पर नजर बनाए रखी",
      newDistrict: "नया जिला कवर किया",
      districtStreak: "एक जिले में 3 रिपोर्ट",
      verifiedSpot: "एक जगह की पुष्टि की",
    },
    toasts: {
      welcome1: "{{name}}पहाड़ों को साफ रखें 🏔️",
      welcome2: "{{name}}हिमाचल देख रहा है। जो दिखे, रिपोर्ट करें 📍",
      welcome3: "हर रिपोर्ट की गई जगह = साफ पहाड़ों की ओर एक और कदम 💚",
      welcome4: "{{name}}वापसी पर स्वागत है। देवभूमि को साफ रखें 🌲",
      loadReports: "रिपोर्ट लोड नहीं हो सकीं। Supabase टेबल, क्रेडेंशियल और कनेक्शन जांचें।",
      gpsUnavailable: "इस डिवाइस पर GPS उपलब्ध नहीं है",
      gpsPinned: "📍 GPS से लोकेशन पिन हो गई",
      gpsFailed: "लोकेशन नहीं मिली — GPS अनुमति जांचें",
      fillRequired: "अपना नाम, जिला और क्षेत्र भरें।",
      addPhoto: "कम से कम एक फोटो जोड़ें।",
      areaAbbr: "क्षेत्र संक्षेप जैसा लग रहा है — पूरा नाम लिखें।",
      flaggedRemoved: "चिन्हित फोटो हटा दी गईं। बाकी फोटो जमा की जा रही हैं।",
      noValidPhotos: "कोई मान्य फोटो नहीं बची। कृपया कम से कम एक फोटो जोड़ें।",
      coordsFailed: "अनुमानित लोकेशन नहीं मिल सकी। कृपया क्षेत्र थोड़ा और स्पष्ट लिखें।",
      submitFailed: "रिपोर्ट भेजना असफल रहा: {{message}}{{hint}}",
      submit404Hint: " जांचें कि reports और report_photos Supabase में मौजूद हैं।",
      unknownError: "अज्ञात त्रुटि",
      districtAuto: "जिला अपने आप चुना गया: {{district}}",
      alreadyConfirmed: "आप इस जगह की पहले ही पुष्टि कर चुके हैं",
      confirmedSpot: "जगह की पुष्टि हुई — सत्यापन के लिए +2 कर्म",
      stateHint: " क्या आपका मतलब \"{{value}}\" था?",
      districtHint: " \"{{value}}\" जैसा कोई जिला चुनें।",
      stateLooksCity: "स्टेट फ़ील्ड: \"{{value}}\" शहर जैसा लगता है।{{hint}}",
      areaLooksState: "एरिया फ़ील्ड: \"{{value}}\" राज्य जैसा लगता है।{{hint}}",
      photoFlagged: "फोटो {{index}}: {{issue}} — इसे हटाएँ या फिर से सबमिट करें।",
      photoBlank: "यह खाली या एक ही रंग की तस्वीर लगती है",
      photoNoDetail: "इस तस्वीर में कोई वास्तविक विवरण नहीं दिख रहा",
      photoIllustration: "यह तस्वीर चित्र या आर्टवर्क जैसी लगती है — कृपया जगह की असली फोटो अपलोड करें",
      photoPerson: "इस फोटो में कोई व्यक्ति दिख रहा है — कृपया लोगों की नहीं, जगह की फोटो अपलोड करें",
      textInappropriate: "{{label}} में अनुचित भाषा है",
      textUnreal: "{{label}} वास्तविक मान जैसा नहीं लगता",
      notesGibberish: "टिप्पणी में अस्पष्ट शब्द दिख रहे हैं — कृपया साफ़ लिखें",
    },
    labels: {
      reporterName: "रिपोर्टर का नाम",
      state: "राज्य",
      area: "क्षेत्र",
      location: "स्थान",
      notes: "टिप्पणी",
    },
  },
};

let currentLang = localStorage.getItem("ds_lang") || "en";
let currentTheme = "light";
let currentDetailId = null;
let lastSuccessState = null;
let mainTileLayer = null;
let detailTileLayer = null;
let pinTileLayer = null;

function lookupTranslation(tree, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), tree);
}

function t(key, vars) {
  const template =
    lookupTranslation(TRANSLATIONS[currentLang], key) ??
    lookupTranslation(TRANSLATIONS.en, key) ??
    key;
  if (typeof template !== "string") return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    vars && vars[name] !== undefined ? vars[name] : "",
  );
}

function getUiLocale() {
  return currentLang === "hi" ? "hi-IN" : "en-IN";
}

function translateCategory(key) {
  return t("categories." + key);
}

function translateSiteType(value) {
  const map = {
    Road: "site.road",
    Footpath: "site.footpath",
    "Nala / Drain": "site.nalaDrain",
    "Open plot": "site.openPlot",
    "Near temple": "site.nearTemple",
    "Tourist spot": "site.touristSpot",
    "River / Nala bank": "site.riverBank",
    "Forest area": "site.forestArea",
    Market: "site.market",
    "Near school": "site.nearSchool",
    "Near hospital": "site.nearHospital",
  };
  return map[value] ? t(map[value]) : value;
}

function translateSeverity(value) {
  const map = {
    Minor: "severity.minor",
    Moderate: "severity.moderate",
    Severe: "severity.severe",
    "Blocking road": "severity.blockingRoad",
  };
  return map[value] ? t(map[value]) : value;
}

function translateLevelTitle(key) {
  return t("levels." + key);
}

function translateMilestoneTitle(title) {
  const map = {
    "First Reporter": "milestones.firstReporter",
    "Hill Guardian": "milestones.hillGuardian",
    "Devbhoomi Watchdog": "milestones.watchdog",
    "Clean Himachal Champion": "milestones.champion",
    "Pahadi Legend": "milestones.legend",
  };
  return map[title] ? t(map[title]) : title;
}

function translateLogLabel(label) {
  const map = {
    "First eyes on the ground": "karmaLabels.firstEyes",
    "Another spot mapped": "karmaLabels.anotherSpot",
    "Expanding the map": "karmaLabels.expandingMap",
    "District watchdog": "karmaLabels.districtWatchdog",
    "Still watching": "karmaLabels.stillWatching",
    "Kept watch on the ground": "karmaLabels.keptWatch",
    "Covered a new district": "karmaLabels.newDistrict",
    "3 reports in one district": "karmaLabels.districtStreak",
    "Verified a spot": "karmaLabels.verifiedSpot",
  };
  return map[label] ? t(map[label]) : label;
}

function formatReportCount(count) {
  return count === 1
    ? t("feed.reportSingular", { count })
    : t("feed.reportPlural", { count });
}

function reporterByline(name) {
  return currentLang === "hi" ? "द्वारा " + name : "by " + name;
}

function createTileLayer() {
  const isDark = currentTheme === "dark";
  const url = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  return L.tileLayer(url, {
    attribution: "© OpenStreetMap © CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  });
}

function refreshMapTheme() {
  if (map && mainTileLayer) {
    map.removeLayer(mainTileLayer);
    mainTileLayer = createTileLayer().addTo(map);
  }
  if (detMap && detailTileLayer) {
    detMap.removeLayer(detailTileLayer);
    detailTileLayer = createTileLayer().addTo(detMap);
  }
  if (pinMap && pinTileLayer) {
    pinMap.removeLayer(pinTileLayer);
    pinTileLayer = createTileLayer().addTo(pinMap);
  }
}

function updateThemeMeta() {
  const meta = document.getElementById("theme-color-meta");
  if (meta) meta.setAttribute("content", currentTheme === "dark" ? "#141C1A" : "#FFFFFF");
}

function updateThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  const label = document.getElementById("theme-toggle-label");
  if (label) {
    label.textContent =
      currentTheme === "dark" ? t("nav.lightMode") : t("nav.darkMode");
  }
  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      currentTheme === "dark" ? t("nav.lightMode") : t("nav.darkMode"),
    );
  }
}

function applyTheme(theme, persist) {
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  if (persist) localStorage.setItem("ds_theme", theme);
  updateThemeMeta();
  updateThemeToggle();
  refreshMapTheme();
}

function toggleTheme() {
  applyTheme(currentTheme === "dark" ? "light" : "dark", true);
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLang === "hi" ? "hi" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) langBtn.textContent = currentLang === "en" ? "हिंदी" : "English";
}

function applyLang() {
  applyStaticTranslations();
  populateDistrictDropdowns();
  buildDistrictFilter();
  buildCatFilter();
  applyFilters();
  renderKarmaPanel();
  renderPreviews();
  if (currentDetailId) {
    const detail = reports.find((r) => r.id === currentDetailId);
    if (detail) renderDetail(detail);
  }
  if (lastSuccessState) renderSuccessState();
  updateThemeToggle();
}

function toggleLang() {
  currentLang = currentLang === "en" ? "hi" : "en";
  localStorage.setItem("ds_lang", currentLang);
  applyLang();
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   REPORT UPVOTE (I see this too)
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function getUpvotes() {
  try {
    const raw = localStorage.getItem('ds_upvotes');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function upvoteReport(reportId) {
  const upvotes = getUpvotes();
  if (upvotes[reportId]) {
    toast(t("toasts.alreadyConfirmed"), false);
    return;
  }
  upvotes[reportId] = Date.now();
  localStorage.setItem('ds_upvotes', JSON.stringify(upvotes));
  // Update UI
  const btn = document.getElementById('upvote-' + reportId);
  if (btn) {
    btn.classList.add('upvoted');
    btn.innerHTML = t("detail.upvoted");
  }
  toast(t("toasts.confirmedSpot"), false);
  // Award karma for confirming
  const identity = getReporterIdentity();
  identity.totalKarma = (identity.totalKarma || 0) + 2;
  if (!identity.log) identity.log = [];
  identity.log.unshift({ points: 2, labels: ['Verified a spot'], district: '', ts: new Date().toISOString() });
  localStorage.setItem('ds_reporter', JSON.stringify(identity));
}

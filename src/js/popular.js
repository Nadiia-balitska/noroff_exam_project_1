const API_BASE = window.__API_BASE__ || 'https://v2.api.noroff.dev';
const API = `${API_BASE}/online-shop`;

const state = {
  page: 1,
  limit: 12,
  items: [],
  q: "",
  filter: "all",
  loading: false,
  hasMore: true,
};

const CATEGORY_MAP = {
  all: [],
  smartphones: ["smartphone","smartphones","phone","iphone","android","galaxy","pixel"],
  laptops: ["laptop","laptops","notebook","macbook","ultrabook"],
  tablets: ["tablet","tablets","ipad","galaxy tab"],
  gaming: ["gaming","console","xbox","playstation","ps5","ps4","nintendo","switch","gpu","graphics card"],
  wearables: ["wearable","wearables","watch","smartwatch","fitbit","band","airpods","buds"]
};

function isOwner(){
  const url = new URL(location.href);
  if (url.searchParams.get("owner")==="1") return true;
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    return !!auth?.token;
  } catch { return false; }
}

const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

function starRow(r){
  const full=Math.floor(Number(r)||0);
  let s=""; for(let i=0;i<5;i++) s+= i<full?'<span class="on">★</span>':'☆';
  return s;
}

function clientFilter(items, q, filter){
  const ql = (q||"").trim().toLowerCase();
  const tokens = CATEGORY_MAP[filter] || (filter && filter!=="all" ? [String(filter).toLowerCase()] : []);
  return items.filter(p => {
    const hay = [p?.title, p?.description, p?.category, ...(p?.tags||[])].join(" ").toLowerCase();
    const matchQ = ql ? hay.includes(ql) : true;
    const matchF = tokens.length ? tokens.some(t => hay.includes(t)) : true;
    return matchQ && matchF;
  });
}

async function fetchPage({ page, limit, q, filter }) {
  const u = new URL(API);
  u.searchParams.set("page", page);
  u.searchParams.set("limit", limit);
  if (q && q.trim()) u.searchParams.set("q", q.trim());
  const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const items = Array.isArray(json?.data) ? json.data : [];
  const meta  = json?.meta;
  let hasMore = meta ? (meta.currentPage < meta.pageCount) : (items.length === limit);
  const filtered = clientFilter(items, q, filter);
  if ((q && q.trim()) || (filter && filter !== "all")) {
    hasMore = filtered.length === limit && hasMore;
    if (filtered.length === 0) hasMore = false;
  }
  return { items: filtered, hasMore };
}

function render(items, append=false){
  const grid  = $("#popular-grid");
  const count = $("#popular-count");
  const more  = $("#popular-more");
  if (!grid) return;

  if (!append) grid.innerHTML = "";
  items.forEach(p => {
    const rating = Number(p?.rating ?? 0);
    const price  = Number(p?.price ?? 0);
    const imgUrl = p?.image?.url || "https://placehold.co/640x400?text=No+Image";
    const imgAlt = p?.image?.alt || p?.title || "Product image";
    const productUrl = `/src/pages/product.html?id=${encodeURIComponent(p.id)}`;

    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = p.id;
    card.innerHTML = `
      <a class="thumb" href="${productUrl}" aria-label="Open ${p?.title || 'product'}">
        <img src="${imgUrl}" alt="${imgAlt}">
      </a>
      <div class="body">
        <h3><a href="${productUrl}">${p?.title || "Untitled"}</a></h3>
        <div class="meta">
          <div class="stars" aria-hidden="true">${starRow(rating)}</div>
          <small>${rating.toFixed(1)}</small>
        </div>
        <p>${p?.description || ""}</p>
        <div class="price">$${price.toFixed(2)}</div>
        <div class="actions">
          <a class="btn btn-primary" href="${productUrl}">View Details</a>
          ${isOwner() ? `<button class="btn btn-ghost" data-add="${p.id}">Add to Cart</button>` : ""}
        </div>
      </div>`;
    grid.appendChild(card);
  });

  state.items = append ? state.items.concat(items) : items;
  if (count) count.textContent = String(state.items.length);
  if (more)  more.style.display = state.hasMore ? "inline-flex" : "none";
}

function attachCart(){
  const grid = $("#popular-grid");
  if (!grid) return;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  grid.addEventListener("click", e => {
    const btn = e.target.closest("[data-add]");
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.getAttribute("data-add");
    if (!cart.includes(id)) cart.push(id);
    localStorage.setItem("cart", JSON.stringify(cart));
    btn.textContent = "Added ✓";
  });
}

async function loadInitial(){
  if (state.loading) return; state.loading = true;
  const grid = $("#popular-grid");
  if (grid) grid.innerHTML = `<div class="card"><div class="body"><p>Loading...</p></div></div>`;
  try{
    state.page = 1; state.items = [];
    const { items, hasMore } = await fetchPage({ page: 1, limit: state.limit, q: state.q, filter: state.filter });
    state.hasMore = hasMore;
    render(items, false);
    if (!items.length && grid){
      grid.innerHTML = `<div class="card"><div class="body"><p>No products match your filters.</p><div class="actions"><button class="btn btn-ghost" id="popular-clear">Clear filters</button></div></div></div>`;
      const more = $("#popular-more"); if (more) more.style.display = "none";
      const clear = document.getElementById("popular-clear");
      clear?.addEventListener("click", async () => {
        state.q = ""; state.filter = "all"; const s = $("#popular-search"); if (s) s.value = "";
        $$("#popular .chip").forEach(c=>c.classList.toggle("is-active", c.dataset.filter==="all"));
        await loadInitial();
      });
    }
  } catch (e){
    if (grid) grid.innerHTML = `<div class="card"><div class="body"><p>Failed to load: ${e.message}</p></div></div>`;
    state.hasMore = false;
    const more = $("#popular-more"); if (more) more.style.display = "none";
  } finally { state.loading = false; }
}

async function loadMore(){
  if (state.loading || !state.hasMore) return; state.loading = true;
  try{
    const nextPage = state.page + 1;
    const { items, hasMore } = await fetchPage({ page: nextPage, limit: state.limit, q: state.q, filter: state.filter });
    state.page = nextPage;
    state.hasMore = hasMore;
    render(items, true);
  } catch(e){
    console.error(e);
  } finally { state.loading = false; }
}

export async function initPopular(){
  const search = $("#popular-search");
  const more   = $("#popular-more");
  const chips  = $$("#popular .chip");

  const deb = (fn, ms=300)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms);} };

  search?.addEventListener("input", deb(async (e) => {
    state.q = e.target.value;
    await loadInitial();
  }, 300));

  chips.forEach(ch => ch.addEventListener("click", async () => {
    chips.forEach(c => c.classList.remove("is-active"));
    ch.classList.add("is-active");
    state.filter = (ch.dataset.filter || "all").toLowerCase();
    await loadInitial();
  }));

  more?.addEventListener("click", loadMore);

  document.addEventListener("auth:changed", loadInitial);

  attachCart();
  await loadInitial();
}

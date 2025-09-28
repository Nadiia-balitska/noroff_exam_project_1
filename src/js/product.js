const API_BASE = window.__API_BASE__ || "https://v2.api.noroff.dev";
const API = `${API_BASE}/online-shop`;

const isOwner = (() => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("owner") === "1") localStorage.setItem("role", "owner");
  return localStorage.getItem("role") === "owner";
})();

const $ = (sel, root=document) => root.querySelector(sel);

function stars(r){
  const n = Math.round(Number(r) || 0);
  let s = "";
  for (let i=0;i<5;i++) s += i < n ? "★" : "☆";
  return s;
}

async function getProduct(id){
  const res = await fetch(`${API}/${encodeURIComponent(id)}`, { headers:{Accept:"application/json"} });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json?.data || json;
}

function priceBlock(p){
  const price = Number(p?.price ?? 0);
  const discounted = Number(p?.discountedPrice ?? (p?.discountPercentage ? price*(1 - Number(p.discountPercentage)/100) : price));
  const hasDiscount = discounted < price && discounted > 0;
  return `
    <div class="p-price">
      <span class="now">$${discounted.toFixed(2)}</span>
      ${hasDiscount ? `<span class="old">$${price.toFixed(2)}</span>` : ""}
    </div>
  `;
}

function tagsBlock(tags){
  if(!Array.isArray(tags) || !tags.length) return "";
  return `<div class="p-tags">${tags.map(t=>`<span class="p-tag">#${t}</span>`).join("")}</div>`;
}

function reviewsBlock(reviews){
  if(!Array.isArray(reviews) || !reviews.length){
    return `<div class="p-reviews"><h3>Reviews</h3><p class="p-empty">No reviews yet.</p></div>`;
  }
  const list = reviews.map(r => `
    <div class="p-review">
      <div class="r-head">
        <span class="r-name">${r?.username || "User"}</span>
        <span class="r-stars" aria-hidden="true">${stars(r?.rating)}</span>
      </div>
      <p class="r-text">${r?.description || ""}</p>
    </div>
  `).join("");
  return `<div class="p-reviews"><h3>Reviews (${reviews.length})</h3>${list}</div>`;
}

function shareUrl(id){
  const url = new URL(window.location.href);
  url.searchParams.set("id", id);
  return url.toString();
}

function renderProduct(p){
  const wrap = $("#product");
  const imgUrl = p?.image?.url || "https://placehold.co/960x600?text=No+Image";
  const imgAlt = p?.image?.alt || p?.title || "Product image";
  wrap.innerHTML = `
    <div class="p-gallery">
      <div class="hero"><img src="${imgUrl}" alt="${imgAlt}"></div>
    </div>
    <div class="p-info">
      <h1 class="p-title">${p?.title || "Untitled product"}</h1>
      <div class="p-rating">
        <div class="p-stars" aria-hidden="true">${stars(p?.rating)}</div>
        <small>${Number(p?.rating ?? 0).toFixed(1)}</small>
      </div>
      ${priceBlock(p)}
      <p class="p-desc">${p?.description || ""}</p>
      ${tagsBlock(p?.tags)}

      <div class="p-actions">
        <button id="share-btn" class="p-share"><span>Share</span></button>
        <button class="btn btn-primary" onclick="location.href='/'">Home</button>
        ${isOwner ? `<button id="add-cart" class="btn btn-ghost">Add to Cart</button>` : ""}
      </div>

      ${reviewsBlock(p?.reviews)}
    </div>
  `;

  const shareBtn = $("#share-btn", wrap);
  shareBtn?.addEventListener("click", async () => {
    const url = shareUrl(p.id);
    try{
      if (navigator.share) await navigator.share({ title: p.title, url });
      else {
        await navigator.clipboard.writeText(url);
        shareBtn.textContent = "Copied!";
        setTimeout(()=> shareBtn.textContent = "Share", 1200);
      }
    }catch{}
  });

  const add = $("#add-cart", wrap);
  if(add){
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    add.addEventListener("click", ()=>{
      if(!cart.includes(p.id)) cart.push(p.id);
      localStorage.setItem("cart", JSON.stringify(cart));
      add.textContent = "Added ✓";
    });
  }
}

export async function initProduct(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const mount = $("#product");
  if(!mount){ return; }

  if(!id){
    mount.innerHTML = `<div class="p-info"><p class="p-empty">No product ID provided.</p></div>`;
    return;
  }

  mount.innerHTML = `<div class="p-info"><p>Loading product…</p></div>`;
  try{
    const data = await getProduct(id);
    renderProduct(data);
    document.title = `${data?.title || "Product"} • HotView Labs`;
  }catch(e){
    mount.innerHTML = `<div class="p-info"><p class="p-empty">Failed to load product: ${e.message}</p></div>`;
  }
}

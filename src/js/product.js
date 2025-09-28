const API_BASE = window.__API_BASE__ || "https://v2.api.noroff.dev";
const API = `${API_BASE}/online-shop`;

const isOwner = (() => {
  const url = new URL(window.location.href);

  if (url.searchParams.get("owner") === "1") {
    const devAuth = { token: "dev-owner", name: "Owner (dev)" };
    try { localStorage.setItem("auth", JSON.stringify(devAuth)); } catch {}
  }

  let loggedIn = false;
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    loggedIn = !!auth?.token;
  } catch {}

  return loggedIn;
})();


const $ = (s, r = document) => r.querySelector(s);

function stars(r) {
  const n = Math.round(Number(r) || 0);
  return "★★★★★☆☆☆☆☆".slice(5 - n, 10 - n);
}

function getId() {
  const u = new URL(location.href);
  return u.searchParams.get("id") || (u.hash.match(/id=([^&]+)/)?.[1] ?? null);
}

async function getProduct(id) {
  const url = `${API}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} at ${url}${body ? `\n${body.slice(0, 120)}` : ""}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const body = await res.text().catch(() => "");
    throw new Error(`Unexpected response (not JSON) at ${url}${body ? `\n${body.slice(0, 120)}` : ""}`);
  }
  const j = await res.json();
  return j?.data ?? j;
}

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.hidden = true), 1600);
}

function render(p) {
  const root = $("#product");
  const img = p?.image?.url || "https://placehold.co/800x600?text=No+Image";
  const alt = p?.image?.alt || p?.title || "Product image";
  const rating = Number(p?.rating ?? 0).toFixed(1);

  const basePrice = Number(p?.price ?? 0);
  const discounted = Number(
    p?.discountedPrice ?? (p?.discountPercentage ? basePrice * (1 - Number(p.discountPercentage) / 100) : basePrice)
  );
  const hasDiscount = discounted > 0 && discounted < basePrice;

  const thumbs = (Array.isArray(p?.images) && p.images.length ? p.images.map((x) => x.url) : [img, img, img]).slice(0, 3);

  root.innerHTML = `
    <div class="p-grid">
      <div class="p-gallery">
        <div class="hero"><img id="p-hero" src="${img}" alt="${alt}" loading="eager"></div>
        <div class="p-thumbs" id="p-thumbs">
          ${thumbs
            .map(
              (u, i) => `
            <button class="p-thumb" aria-current="${i === 0}">
              <img src="${u}" alt="thumbnail ${i + 1}" loading="lazy">
            </button>`
            )
            .join("")}
        </div>
      </div>

      <div class="p-info">
        ${p?.category ? `<span class="p-cat">${p.category}</span>` : ""}
        <h1 class="p-title">${p?.title || "Untitled"}</h1>

        <div class="p-rating">
          <span class="p-stars" aria-hidden="true">${stars(p?.rating)}</span>
          <small>${rating}</small>
        </div>

        <div class="p-price">
          <span class="now">$${discounted.toFixed(2)}</span>
          ${hasDiscount ? `<span class="old" style="margin-left:8px;opacity:.6;text-decoration:line-through">$${basePrice.toFixed(2)}</span>` : ""}
        </div>

        <div class="p-desc">
          <h4>Description</h4>
          <p>${p?.description || ""}</p>
        </div>

        <div class="p-actions">
          ${isOwner ? `<button id="p-add" class="p-add"><span class="ico">🛒</span> Add to cart</button>` : ""}
          <button id="p-heart" class="p-heart" aria-label="Add to wishlist">♡</button>
        </div>
      </div>
    </div>
  `;

  const hero = $("#p-hero", root);
  $("#p-thumbs", root)?.addEventListener("click", (e) => {
    const btn = e.target.closest(".p-thumb");
    if (!btn) return;
    const src = $("img", btn)?.src;
    if (!src) return;
    hero.src = src;
    [...e.currentTarget.children].forEach((c) => c.setAttribute("aria-current", "false"));
    btn.setAttribute("aria-current", "true");
  });

  $("#p-add")?.addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!cart.includes(p.id)) cart.push(p.id);
    localStorage.setItem("cart", JSON.stringify(cart));
    toast("Added to cart ✓");
    const btn = $("#p-add");
    if (btn) {
      btn.textContent = "✓ Added";
      btn.disabled = true;
      btn.style.opacity = ".85";
    }
  });

  $("#p-heart")?.addEventListener("click", (e) => {
    e.currentTarget.textContent = e.currentTarget.textContent === "♡" ? "❤" : "♡";
  });

  const shareBtn = $("#p-share") || document.getElementById("p-share");
  shareBtn?.addEventListener("click", async () => {
    const url = new URL(location.href);
    url.searchParams.set("id", p.id);
    try {
      if (navigator.share) await navigator.share({ title: p.title, url: url.toString() });
      else {
        await navigator.clipboard.writeText(url.toString());
        toast("Product link copied to clipboard!");
      }
    } catch {}
  });
}

export async function initProduct() {
  document.body.classList.add("is-product");

  const id = getId();
  const mount = $("#product");
  if (!mount) return;
  if (!id) {
    mount.innerHTML = `<p class="p-empty">No product ID provided.</p>`;
    return;
  }

  mount.innerHTML = `<p class="p-empty">Loading product…</p>`;
  try {
    const p = await getProduct(id);
    render(p);
    document.title = `${p?.title || "Product"} • HotView Labs`;
  } catch (err) {
    console.error("[product] load failed", err);
    mount.innerHTML = `<div class="p-info"><p class="p-empty">Failed to load product: ${err.message}</p></div>`;
  }
}

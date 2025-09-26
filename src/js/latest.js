if (!window.__API_BASE__) {
  console.warn("⚠️ __API_BASE__ not set. Using default Noroff API.");
  window.__API_BASE__ = "https://v2.api.noroff.dev";
}
const API = `${window.__API_BASE__}/online-shop`;



const isOwner = (() => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("owner") === "1") localStorage.setItem("role", "owner");
  return localStorage.getItem("role") === "owner";
})();

function waitFor(selector, root = document, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const found = root.querySelector(selector);
    if (found) return resolve(found);
    const obs = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout waiting for ${selector}`)); }, timeout);
  });
}

function starRow(r) {
  const full = Math.floor(Number(r) || 0);
  let s = "";
  for (let i = 0; i < 5; i++) s += i < full ? '<span class="on">★</span>' : "☆";
  return s;
}

async function getLatest(limit = 3) {
  const url = `${API}?limit=${limit}&page=1&sort=id&sortOrder=desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
  if (!products.length) {
  products = [
    { id: "stub1", title: "No products", price: 0, rating: 0, description: "—", image: { url: "https://placehold.co/600x400?text=No+Data" } },
  ];
}

}

export async function initLatest() {
  await waitFor("#latest .track");

  const track   = document.getElementById("track");
  const dots    = document.getElementById("dots");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  track.innerHTML = `<article class="slide"><div class="copy"><p>Loading latest products…</p></div></article>`;

  function render(products) {
    track.innerHTML = "";
    dots.innerHTML = "";

    products.forEach((p, idx) => {
      const slide = document.createElement("article");
      slide.className = "slide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `${idx + 1} of ${products.length}`);

      const imgUrl = p?.image?.url || "";
      const imgAlt = p?.image?.alt || p.title || "Product image";
      const rating = p?.rating ?? 0;
      const price  = Number(p?.price ?? 0);

      slide.innerHTML = `
        <div class="media">
          <img src="${imgUrl}" alt="${imgAlt}">
        </div>
        <div class="copy">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <div class="rating">
            <div class="stars" aria-hidden="true">${starRow(rating)}</div>
            <small>${Number(rating).toFixed(1)}</small>
          </div>
          <div class="price">$${price.toFixed(2)}</div>
          <div class="actions">
            <button class="btn btn-primary" onclick="location.href='product.html?id=${p.id}'">View Product 🧭</button>
            ${isOwner ? `<button class="btn btn-ghost" data-add="${p.id}">Add to Cart 🛒</button>` : ""}
          </div>
        </div>
      `;
      track.appendChild(slide);

      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Go to slide ${idx + 1}`);
      dot.addEventListener("click", () => goTo(idx));
      dots.appendChild(dot);
    });

    update();
  }

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const id = btn.getAttribute("data-add");
    if (!cart.includes(id)) cart.push(id);
    localStorage.setItem("cart", JSON.stringify(cart));
    btn.textContent = "Added ✓";
  });

  let index = 0;
  function update() {
    track.style.transform = `translateX(${-100 * index}%)`;
    [...dots.children].forEach((d, i) => d.setAttribute("aria-current", i === index ? "true" : "false"));
  }
  function goTo(i) { index = (i + dots.children.length) % dots.children.length; update(); }
  function next()   { goTo(index + 1); }
  function prev()   { goTo(index - 1); }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft")  prev();
  });

  let auto = setInterval(next, 6000);
  [prevBtn, nextBtn, track].forEach((el) => {
    el.addEventListener("pointerenter", () => clearInterval(auto));
    el.addEventListener("pointerleave", () => (auto = setInterval(next, 6000)));
  });

  try {
    const items = await getLatest(3);
    render(items);
  } catch (err) {
    track.innerHTML = `<article class="slide"><div class="copy"><p>Failed to load products: ${err.message}</p></div></article>`;
  }
}

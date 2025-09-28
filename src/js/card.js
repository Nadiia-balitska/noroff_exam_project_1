const API = "https://v2.api.noroff.dev/online-shop";

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

const els = {
  container: $("#cart-items"),
  subtotal:  $("#subtotal"),
  shipping:  $("#shipping"),
  total:     $("#total"),
  form:      $("#payment-form"),
};

const SHIPPING_FEE = 10;
function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem("cart") || "[]");
    if (Array.isArray(raw) && raw.length && typeof raw[0] === "string") {
      const counts = raw.reduce((m, id) => (m[id] = (m[id] || 0) + 1, m), {});
      return Object.entries(counts).map(([id, qty]) => ({ id, qty }));
    }
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
function writeCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

let cart = readCart();

async function fetchProduct(id) {
  const res = await fetch(`${API}/${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

async function renderCart() {
  if (!els.container) return;

  if (!cart.length) {
    els.container.innerHTML = `<p>Your cart is empty 🛒</p>`;
    if (els.subtotal) els.subtotal.textContent = "0$";
    if (els.total)    els.total.textContent    = "0$";
    return;
  }

  const uniqIds = [...new Set(cart.map(i => i.id))];

  const productMap = {};
  await Promise.all(uniqIds.map(async (id) => {
    try { productMap[id] = await fetchProduct(id); } catch {}
  }));

  let subtotal = 0;
  els.container.innerHTML = cart.map(item => {
    const p = productMap[item.id];
    if (!p) return ""; 
    const img = p?.image?.url || "https://placehold.co/120x120?text=No+Image";
    const title = p?.title || "Untitled";
    const price = Number(p?.price ?? 0);
    const line = price.toFixed(1) * item.qty;
    subtotal += line;

    return `
      <div class="cart-item" data-id="${p.id}">
        <img class="thumb" src="${img}" alt="${title}">
        <div class="info">
          <h3 class="title">${title}</h3>
          <p class="price-single">$${price.toFixed(2)}</p>
          <div class="quantity">
            <button class="qty-btn" data-action="dec" aria-label="Decrease">−</button>
            <span class="qty" aria-live="polite">${item.qty}</span>
            <button class="qty-btn" data-action="inc" aria-label="Increase">+</button>
          </div>
          <p class="line-price">$${line.toFixed(1)}</p>
        </div>
        <button class="remove-btn" data-remove="${p.id}" aria-label="Remove">Remove</button>
      </div>
    `;
  }).join("");

  if (els.subtotal) els.subtotal.textContent = `${subtotal}$`;
  if (els.shipping) els.shipping.textContent = `${SHIPPING_FEE}$`;
  if (els.total)    els.total.textContent    = `${(subtotal + SHIPPING_FEE)}$`;
}

if (els.container) {
  els.container.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) {
      const id = removeBtn.getAttribute("data-remove");
      cart = cart.filter(i => i.id !== id);
      writeCart(cart);
      renderCart();
      return;
    }

    const btn = e.target.closest(".qty-btn");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const itemEl = e.target.closest(".cart-item");
    const id = itemEl?.getAttribute("data-id");
    if (!id) return;

    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (action === "inc") item.qty += 1;
    if (action === "dec") item.qty = Math.max(1, item.qty - 1);

    writeCart(cart);
    renderCart();
  });
}

if (els.form) {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cart.length) return;

    alert("✅ Payment Successful!");
    cart = [];
    writeCart(cart);
    location.href = "/src/pages/paymentSuccess.html";
  });
}

renderCart();

window.showToast = (msg, type="success") => {
  const box = document.getElementById("toastContainer");
  if (!box) return alert(msg);
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(()=>t.remove(), 3000);
};

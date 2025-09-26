export function initSubscribe(){
  const form = document.getElementById("subscribe-form");
  const email = document.getElementById("subscribe-email");
  const btn = document.getElementById("subscribe-btn");
  const hint = document.getElementById("subscribe-hint");
  if(!form || !email || !btn) return;

  function valid(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const v = email.value;
    if(!valid(v)){
      hint.textContent = "Please enter a valid email address.";
      hint.className = "subscribe-hint err";
      email.focus();
      return;
    }
    btn.disabled = true;
    btn.style.opacity = ".7";
    setTimeout(()=>{
      hint.textContent = "Thank you! We will contact you soon.";
      hint.className = "subscribe-hint ok";
      form.reset();
      btn.disabled = false;
      btn.style.opacity = "1";
    }, 350);
  });
}

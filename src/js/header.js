const STORAGE_KEY = "auth"; 

function getAuth(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch{ return null; }
}
function setAuth(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  document.dispatchEvent(new Event("auth:changed"));
}
function clearAuth(){
  localStorage.removeItem(STORAGE_KEY);
  document.dispatchEvent(new Event("auth:changed"));
}

function initialsFrom(name="", email=""){
  const n = (name || email || "User").trim();
  const parts = n.split(/\s+/);
  const letters = (parts[0]?.[0] || "U") + (parts[1]?.[0] || "");
  return letters.toUpperCase();
}

export function initHeader(){
  const guest = document.getElementById("header-guest");
  const user  = document.getElementById("header-user");
  const logoutBtn = document.getElementById("logout-btn");
  const nameEl = document.getElementById("user-name");
  const initialsEl = document.getElementById("user-initials");

  function render(){
    const auth = getAuth();
    const loggedIn = !!auth?.token;
    guest.hidden = loggedIn;
    user.hidden  = !loggedIn;

    if (loggedIn){
      nameEl.textContent = auth.name || auth.email || "User";
      initialsEl.textContent = initialsFrom(auth.name, auth.email);
    }
  }

  render();
  document.addEventListener("auth:changed", render);
  window.addEventListener("storage", (e)=>{ if(e.key===STORAGE_KEY) render(); });

  logoutBtn?.addEventListener("click", () => {
    clearAuth();
    window.location.href = "/";
  });

  document.querySelector(".brand")?.addEventListener("click", (e)=>{
    e.preventDefault();
    window.location.href = "/";
  });
}

export function authLoginSuccess({ token, name, email, avatar }){
  setAuth({ token, name, email, avatar });
  window.location.href = "/";
}
export function authLogout(){
  clearAuth();
  window.location.href = "/";
}

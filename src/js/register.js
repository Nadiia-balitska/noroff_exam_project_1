document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const setLoading = (v) => {
    if (!btn) return;
    btn.disabled = v; btn.style.opacity = v ? 0.7 : 1;
    if (v) { btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Creating…'; }
    else   { btn.innerHTML = btn.dataset.label || 'Create Account'; }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email?.value?.trim() || '';
    const password = form.password?.value || '';

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return (window.showToast ? showToast('Enter a valid email', 'error') : alert('Enter a valid email'));
    }
    if (password.length < 8) { 
      return (window.showToast ? showToast('Password must be at least 8 characters', 'error') : alert('Password must be at least 8 characters'));
    }

    setLoading(true);
    try {
      await window.Auth.registerRequest({ email, password });

      try { if (!window.Auth.getToken()) await window.Auth.loginRequest({ email, password }); } catch {}

      (window.showToast ? showToast('Account created! Welcome', 'success') : 0);

      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect') || '/';
      if (window.Auth.getToken()) window.location.assign(redirectTo);
      else window.location.assign('/src/pages/login.html');
    } catch (err) {
      (window.showToast ? showToast(err.message || 'Registration failed', 'error') : alert(err.message || 'Registration failed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  });
});

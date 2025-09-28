import { authLoginSuccess } from "./header.js";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  const setLoading = (v) => {
    if (!submitBtn) return;
    submitBtn.disabled = v;
    submitBtn.style.opacity = v ? 0.7 : 1;
    if (v) submitBtn.dataset.label = submitBtn.innerHTML;
    submitBtn.innerHTML = v ? 'Signing in…' : (submitBtn.dataset.label || submitBtn.innerHTML);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.email?.value?.trim() || '';
    const password = form.password?.value || '';

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return (window.showToast ? showToast('Enter a valid email', 'error') : alert('Enter a valid email'));
    }
    if (password.length < 6) {
      return (window.showToast ? showToast('Password must be at least 6 characters', 'error') : alert('Password must be at least 6 characters'));
    }

    setLoading(true);
    try {
      const { token, user } = await window.Auth.loginRequest({ email, password });

      authLoginSuccess({
        token,
        name: user?.name,
        email: user?.email || email,
        avatar: user?.avatar?.url,
      });

      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect') || '/src';
      window.location.assign(redirectTo);

    } catch (err) {
      (window.showToast ? showToast(err.message || 'Login failed', 'error') : alert(err.message || 'Login failed'));
    } finally {
      setLoading(false);
    }
  });
});

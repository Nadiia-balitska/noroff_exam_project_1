document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  const setLoading = (v) => {
    if (!submitBtn) return;
    submitBtn.disabled = v;
    submitBtn.style.opacity = v ? 0.7 : 1;
    submitBtn.style.pointerEvents = v ? 'none' : 'auto';
    if (v) submitBtn.dataset.label = submitBtn.innerHTML;
    submitBtn.innerHTML = v ? 'Signing in…' : (submitBtn.dataset.label || submitBtn.innerHTML);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.email?.value?.trim() || '';
    const password = form.password?.value || '';

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      (window.showToast ? showToast('Enter a valid email', 'error') : alert('Enter a valid email'));
      return;
    }
    if (password.length < 6) {
      (window.showToast ? showToast('Password must be at least 6 characters', 'error') : alert('Password must be at least 6 characters'));
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await window.Auth.loginRequest({ email, password });

      (window.showToast ? showToast('Signed in successfully!', 'success') : console.log('Signed in', user));
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect') || '/';
      window.location.assign(redirectTo);
    } catch (err) {
      (window.showToast ? showToast(err.message || 'Login failed', 'error') : alert(err.message || 'Login failed'));
    } finally {
      setLoading(false);
    }
  });
});

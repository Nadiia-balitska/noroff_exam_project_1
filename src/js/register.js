document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const setLoading = (v) => {
    if (!btn) return;
    btn.disabled = v;
    btn.style.opacity = v ? 0.7 : 1;
    if (v) { btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Creating…'; }
    else   { btn.innerHTML = btn.dataset.label || 'Create Account'; }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = form.fullName?.value?.trim() || '';
    const email = form.email?.value?.trim() || '';
    const password = form.password?.value || '';
    const confirm  = form.confirmPassword?.value || '';
    const termsOk  = form.querySelector('#terms')?.checked;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return (window.showToast ? showToast('Enter a valid email', 'error') : alert('Enter a valid email'));
    }
    if (password.length < 6) {
      return (window.showToast ? showToast('Password must be at least 6 characters', 'error') : alert('Password must be at least 6 characters'));
    }
    if (password !== confirm) {
      return (window.showToast ? showToast('Passwords do not match', 'error') : alert('Passwords do not match'));
    }
    if (!termsOk) {
      return (window.showToast ? showToast('Please accept Terms & Privacy', 'error') : alert('Please accept Terms & Privacy'));
    }

    setLoading(true);
    try {
      await window.Auth.registerRequest({ email, password });

      const extra = { fullName };
      localStorage.setItem('hv.register.extra', JSON.stringify(extra));

      if (!window.Auth.getToken()) {
        try { await window.Auth.loginRequest({ email, password }); } catch {}
      }

      (window.showToast ? showToast('Account created! Welcome 👋', 'success') : 0);

      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect') || '/';
      if (window.Auth.getToken()) window.location.assign(redirectTo);
      else window.location.assign('/account/login.html');
    } catch (err) {
      (window.showToast ? showToast(err.message || 'Registration failed', 'error') : alert(err.message || 'Registration failed'));
    } finally {
      setLoading(false);
    }
  });
});

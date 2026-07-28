/**
 * Handles login/register forms, session state in the top bar,
 * logout, and simple client-side route guarding for admin pages.
 */

function renderUserChip() {
  const chip = document.getElementById('user-chip-slot');
  if (!chip) return;
  const user = getUser();

  if (!user) {
    chip.innerHTML = `
      <a href="login.html" class="btn btn-secondary">Log in</a>
      <a href="register.html" class="btn btn-primary">Sign up</a>
    `;
    return;
  }

  chip.innerHTML = `
    <span class="user-chip">
      ${user.name} <span class="role-badge">${user.role}</span>
    </span>
    ${user.role === 'admin' ? '<a href="admin.html" class="btn btn-secondary">Admin</a>' : ''}
    <button id="logout-btn" class="btn btn-secondary">Log out</button>
  `;

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearToken();
    renderUserChip();
    window.location.href = 'index.html';
  });
}

function guardAdminPage() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'login.html?redirect=admin.html';
  }
}

function wireLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('auth-error');
    errorBox.classList.add('d-none');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await CampusAPI.login({ email, password });
      setToken(res.token);
      setUser(res.user);
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || 'index.html';
    } catch (err) {
      errorBox.textContent = err.data?.message || 'Login failed. Please try again.';
      errorBox.classList.remove('d-none');
    }
  });
}

function wireRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('auth-error');
    errorBox.classList.add('d-none');

    const payload = {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      matricNumber: document.getElementById('reg-matric').value,
      department: document.getElementById('reg-department').value,
    };

    try {
      const res = await CampusAPI.register(payload);
      setToken(res.token);
      setUser(res.user);
      window.location.href = 'index.html';
    } catch (err) {
      const messages = err.data?.errors?.map((e) => e.msg).join(' ') || err.data?.message;
      errorBox.textContent = messages || 'Registration failed. Please try again.';
      errorBox.classList.remove('d-none');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderUserChip();
  wireLoginForm();
  wireRegisterForm();
});

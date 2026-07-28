/**
 * Central API client for Heritage Campus Nav frontend.
 * Change API_BASE_URL to your deployed backend URL (Render/Vercel) in production.
 */
const API_BASE_URL = window.CAMPUS_NAV_API_BASE || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('campusnav_token');
}

function setToken(token) {
  localStorage.setItem('campusnav_token', token);
}

function clearToken() {
  localStorage.removeItem('campusnav_token');
  localStorage.removeItem('campusnav_user');
}

function getUser() {
  const raw = localStorage.getItem('campusnav_user');
  return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
  localStorage.setItem('campusnav_user', JSON.stringify(user));
}

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { success: false, message: 'Unexpected server response.' };
  }

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

const CampusAPI = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  me: () => apiRequest('/auth/me', { auth: true }),

  // Locations
  getLocations: (params = '') => apiRequest(`/locations${params}`),
  getLocation: (id) => apiRequest(`/locations/${id}`),
  createLocation: (payload) => apiRequest('/locations', { method: 'POST', body: payload, auth: true }),
  updateLocation: (id, payload) => apiRequest(`/locations/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteLocation: (id) => apiRequest(`/locations/${id}`, { method: 'DELETE', auth: true }),

  // Edges
  getEdges: () => apiRequest('/edges'),
  createEdge: (payload) => apiRequest('/edges', { method: 'POST', body: payload, auth: true }),
  deleteEdge: (id) => apiRequest(`/edges/${id}`, { method: 'DELETE', auth: true }),

  // Navigation
  navigate: (from, to, accessible = false) =>
    apiRequest(`/navigate?from=${from}&to=${to}&accessible=${accessible}`),
};

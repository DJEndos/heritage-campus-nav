/**
 * Renders the campus as an SVG blueprint map, handles location search,
 * "from/to" selection, and draws the computed shortest-path route.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX = 100; // locations are stored as 0-100 percentage coordinates

let allLocations = [];
let allEdges = [];
let selected = { from: null, to: null };

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

async function loadCampusData() {
  const [locRes, edgeRes] = await Promise.all([
    CampusAPI.getLocations(),
    CampusAPI.getEdges(),
  ]);
  allLocations = locRes.data;
  allEdges = edgeRes.data;
  renderMap();
  populateDatalist();
}

function renderMap() {
  const svg = document.getElementById('campus-map');
  svg.setAttribute('viewBox', `0 0 ${VIEWBOX} ${VIEWBOX}`);
  svg.innerHTML = '';

  const edgeLayer = el('g', { id: 'edge-layer' });
  const routeLayer = el('g', { id: 'route-layer' });
  const nodeLayer = el('g', { id: 'node-layer' });
  svg.appendChild(edgeLayer);
  svg.appendChild(routeLayer);
  svg.appendChild(nodeLayer);

  const locationMap = new Map(allLocations.map((l) => [l._id, l]));

  allEdges.forEach((edge) => {
    const from = edge.from && (edge.from._id || edge.from);
    const to = edge.to && (edge.to._id || edge.to);
    const fromLoc = locationMap.get(from) || edge.from;
    const toLoc = locationMap.get(to) || edge.to;
    if (!fromLoc || !toLoc || fromLoc.x === undefined || toLoc.x === undefined) return;

    const line = el('line', {
      class: 'map-edge',
      x1: fromLoc.x,
      y1: fromLoc.y,
      x2: toLoc.x,
      y2: toLoc.y,
    });
    edgeLayer.appendChild(line);
  });

  allLocations.forEach((loc) => {
    const g = el('g', { class: 'map-node', 'data-id': loc._id });
    const circle = el('circle', { cx: loc.x, cy: loc.y, r: 2.1 });
    const label = el('text', { x: loc.x, y: loc.y - 3, 'text-anchor': 'middle' });
    label.textContent = loc.code || loc.name;
    g.appendChild(circle);
    g.appendChild(label);
    g.addEventListener('click', () => handleNodeClick(loc));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `Select ${loc.name}`);
    g.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handleNodeClick(loc);
    });
    nodeLayer.appendChild(g);
  });

  refreshNodeStyles();
}

function refreshNodeStyles() {
  document.querySelectorAll('.map-node').forEach((node) => {
    const id = node.getAttribute('data-id');
    node.classList.remove('selected-from', 'selected-to');
    if (selected.from && selected.from._id === id) node.classList.add('selected-from');
    if (selected.to && selected.to._id === id) node.classList.add('selected-to');
  });
}

function handleNodeClick(loc) {
  if (!selected.from || (selected.from && selected.to)) {
    selected = { from: loc, to: null };
  } else if (selected.from._id === loc._id) {
    selected.from = null;
  } else {
    selected.to = loc;
  }
  syncFormInputs();
  refreshNodeStyles();
  if (selected.from && selected.to) computeRoute();
  else clearRoute();
}

function syncFormInputs() {
  document.getElementById('from-input').value = selected.from ? selected.from.name : '';
  document.getElementById('to-input').value = selected.to ? selected.to.name : '';
}

function populateDatalist() {
  ['from', 'to'].forEach((which) => {
    const list = document.getElementById(`${which}-options`);
    if (!list) return;
    list.innerHTML = '';
    allLocations.forEach((loc) => {
      const opt = document.createElement('option');
      opt.value = loc.name;
      list.appendChild(opt);
    });
  });
}

function findLocationByName(name) {
  return allLocations.find((l) => l.name.toLowerCase() === name.trim().toLowerCase());
}

function clearRoute() {
  const layer = document.getElementById('route-layer');
  if (layer) layer.innerHTML = '';
  const summary = document.getElementById('route-summary');
  const directions = document.getElementById('directions-panel');
  if (summary) summary.classList.add('d-none');
  if (directions) directions.innerHTML = '';
}

async function computeRoute() {
  const errorBox = document.getElementById('route-error');
  errorBox.classList.add('d-none');
  errorBox.textContent = '';

  if (!selected.from || !selected.to) return;

  const accessible = document.getElementById('accessible-toggle')?.checked || false;

  try {
    const res = await CampusAPI.navigate(selected.from._id, selected.to._id, accessible);
    drawRoute(res.data.stops);
    renderRouteSummary(res.data);
  } catch (err) {
    clearRoute();
    errorBox.textContent = err.data?.message || 'Could not compute a route.';
    errorBox.classList.remove('d-none');
  }
}

function drawRoute(stops) {
  const layer = document.getElementById('route-layer');
  layer.innerHTML = '';
  if (!stops || stops.length < 2) return;

  const points = stops.map((s) => `${s.x},${s.y}`).join(' ');
  const polyline = el('polyline', { class: 'route-path', points });
  layer.appendChild(polyline);
}

function renderRouteSummary(data) {
  const summary = document.getElementById('route-summary');
  const directions = document.getElementById('directions-panel');

  document.getElementById('stat-distance').textContent = `${data.totalDistanceMeters} m`;
  document.getElementById('stat-time').textContent = `${data.estimatedMinutes} min`;
  document.getElementById('stat-stops').textContent = data.stops.length;

  summary.classList.remove('d-none');

  directions.innerHTML = '';
  const list = document.createElement('ol');
  list.className = 'directions-list';
  data.directions.forEach((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    list.appendChild(li);
  });
  directions.appendChild(list);
}

function wireSearchBox() {
  const input = document.getElementById('quick-search');
  const results = document.getElementById('search-results');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) {
      results.classList.add('d-none');
      return;
    }
    const matches = allLocations
      .filter((l) => l.name.toLowerCase().includes(q) || (l.code || '').toLowerCase().includes(q))
      .slice(0, 8);

    if (matches.length === 0) {
      results.classList.add('d-none');
      return;
    }

    matches.forEach((loc) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `${loc.name}<span class="cat">${loc.category}</span>`;
      btn.addEventListener('click', () => {
        handleNodeClick(loc);
        input.value = '';
        results.classList.add('d-none');
      });
      results.appendChild(btn);
    });
    results.classList.remove('d-none');
  });

  document.addEventListener('click', (e) => {
    if (!results.contains(e.target) && e.target !== input) {
      results.classList.add('d-none');
    }
  });
}

function wireRouteForm() {
  const form = document.getElementById('route-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fromName = document.getElementById('from-input').value;
    const toName = document.getElementById('to-input').value;
    const fromLoc = findLocationByName(fromName);
    const toLoc = findLocationByName(toName);

    const errorBox = document.getElementById('route-error');
    if (!fromLoc || !toLoc) {
      errorBox.textContent = 'Please choose valid locations from the list for both fields.';
      errorBox.classList.remove('d-none');
      return;
    }
    selected = { from: fromLoc, to: toLoc };
    refreshNodeStyles();
    computeRoute();
  });

  document.getElementById('accessible-toggle')?.addEventListener('change', () => {
    if (selected.from && selected.to) computeRoute();
  });

  document.getElementById('clear-route-btn')?.addEventListener('click', () => {
    selected = { from: null, to: null };
    syncFormInputs();
    refreshNodeStyles();
    clearRoute();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('campus-map')) {
    loadCampusData().catch((err) => {
      console.error(err);
      const errorBox = document.getElementById('route-error');
      if (errorBox) {
        errorBox.textContent = 'Could not load campus map data. Is the backend running?';
        errorBox.classList.remove('d-none');
      }
    });
    wireSearchBox();
    wireRouteForm();
  }
});

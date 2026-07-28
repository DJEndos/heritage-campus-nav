/**
 * Admin dashboard: create/edit/delete locations and the paths (edges)
 * that connect them on the campus graph. Requires an admin JWT.
 */

let adminLocations = [];

async function loadAdminData() {
  const [locRes, edgeRes] = await Promise.all([
    CampusAPI.getLocations(),
    CampusAPI.getEdges(),
  ]);
  adminLocations = locRes.data;
  renderLocationsTable(locRes.data);
  renderEdgesTable(edgeRes.data);
  populateEdgeSelects(locRes.data);
}

function renderLocationsTable(locations) {
  const tbody = document.getElementById('locations-tbody');
  tbody.innerHTML = '';
  locations.forEach((loc) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${loc.name}</td>
      <td><code>${loc.code || '—'}</code></td>
      <td><span class="tag">${loc.category}</span></td>
      <td>${loc.x}, ${loc.y}</td>
      <td>${loc.isAccessible ? 'Yes' : 'No'}</td>
      <td><button class="btn btn-danger" data-delete-location="${loc._id}">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-delete-location]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this location and all its connected paths?')) return;
      try {
        await CampusAPI.deleteLocation(btn.dataset.deleteLocation);
        await loadAdminData();
      } catch (err) {
        alert(err.data?.message || 'Could not delete location.');
      }
    });
  });
}

function renderEdgesTable(edges) {
  const tbody = document.getElementById('edges-tbody');
  tbody.innerHTML = '';
  edges.forEach((edge) => {
    const fromName = edge.from?.name || 'Unknown';
    const toName = edge.to?.name || 'Unknown';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fromName}</td>
      <td>${toName}</td>
      <td>${edge.distanceMeters} m</td>
      <td><span class="tag">${edge.pathType}</span></td>
      <td>${edge.isAccessible ? 'Yes' : 'No'}</td>
      <td><button class="btn btn-danger" data-delete-edge="${edge._id}">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-delete-edge]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this path?')) return;
      try {
        await CampusAPI.deleteEdge(btn.dataset.deleteEdge);
        await loadAdminData();
      } catch (err) {
        alert(err.data?.message || 'Could not delete path.');
      }
    });
  });
}

function populateEdgeSelects(locations) {
  ['edge-from', 'edge-to'].forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="">Select location…</option>';
    locations.forEach((loc) => {
      const opt = document.createElement('option');
      opt.value = loc._id;
      opt.textContent = loc.name;
      select.appendChild(opt);
    });
  });
}

function wireLocationForm() {
  const form = document.getElementById('location-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('admin-error');
    errorBox.classList.add('d-none');

    const payload = {
      name: document.getElementById('loc-name').value,
      code: document.getElementById('loc-code').value || undefined,
      category: document.getElementById('loc-category').value,
      description: document.getElementById('loc-description').value,
      x: Number(document.getElementById('loc-x').value),
      y: Number(document.getElementById('loc-y').value),
      isAccessible: document.getElementById('loc-accessible').checked,
    };

    try {
      await CampusAPI.createLocation(payload);
      form.reset();
      await loadAdminData();
    } catch (err) {
      const messages = err.data?.errors?.map((e) => e.msg).join(' ') || err.data?.message;
      errorBox.textContent = messages || 'Could not create location.';
      errorBox.classList.remove('d-none');
    }
  });
}

function wireEdgeForm() {
  const form = document.getElementById('edge-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById('admin-error');
    errorBox.classList.add('d-none');

    const payload = {
      from: document.getElementById('edge-from').value,
      to: document.getElementById('edge-to').value,
      distanceMeters: Number(document.getElementById('edge-distance').value),
      pathType: document.getElementById('edge-type').value,
      isAccessible: document.getElementById('edge-accessible').checked,
      bidirectional: true,
    };

    try {
      await CampusAPI.createEdge(payload);
      form.reset();
      await loadAdminData();
    } catch (err) {
      const messages = err.data?.errors?.map((e) => e.msg).join(' ') || err.data?.message;
      errorBox.textContent = messages || 'Could not create path.';
      errorBox.classList.remove('d-none');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('locations-tbody')) {
    guardAdminPage();
    loadAdminData().catch((err) => console.error(err));
    wireLocationForm();
    wireEdgeForm();
  }
});

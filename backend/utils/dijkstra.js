/**
 * Computes the shortest path between two nodes in the campus graph.
 * @param {Array} locations - array of Location docs (must include _id)
 * @param {Array} edges - array of Edge docs (from, to, distanceMeters, bidirectional, isAccessible)
 * @param {String} startId - starting location id
 * @param {String} endId - destination location id
 * @param {Boolean} accessibleOnly - if true, only use edges marked isAccessible
 * @returns {Object} { path: [locationIds], distance: Number, steps: [{from,to,distance}] } or null if no path
 */
function findShortestPath(locations, edges, startId, endId, accessibleOnly = false) {
  const graph = new Map();
  locations.forEach((loc) => graph.set(String(loc._id), []));

  edges.forEach((edge) => {
    if (accessibleOnly && !edge.isAccessible) return;
    const from = String(edge.from);
    const to = String(edge.to);
    if (!graph.has(from) || !graph.has(to)) return;

    graph.get(from).push({ node: to, weight: edge.distanceMeters, edge });
    if (edge.bidirectional) {
      graph.get(to).push({ node: from, weight: edge.distanceMeters, edge });
    }
  });

  const distances = new Map();
  const previous = new Map();
  const visited = new Set();
  const queue = new Set(graph.keys());

  graph.forEach((_, node) => distances.set(node, Infinity));
  distances.set(String(startId), 0);

  while (queue.size > 0) {
    // Get unvisited node with smallest distance
    let current = null;
    let smallest = Infinity;
    for (const node of queue) {
      if (distances.get(node) < smallest) {
        smallest = distances.get(node);
        current = node;
      }
    }

    if (current === null) break; // remaining nodes unreachable
    if (current === String(endId)) break;

    queue.delete(current);
    visited.add(current);

    const neighbors = graph.get(current) || [];
    for (const { node, weight } of neighbors) {
      if (visited.has(node)) continue;
      const alt = distances.get(current) + weight;
      if (alt < distances.get(node)) {
        distances.set(node, alt);
        previous.set(node, current);
      }
    }
  }

  const end = String(endId);
  if (distances.get(end) === Infinity || distances.get(end) === undefined) {
    return null; // no path found
  }

  // Reconstruct path
  const path = [];
  let node = end;
  while (node !== undefined) {
    path.unshift(node);
    node = previous.get(node);
  }

  if (path[0] !== String(startId)) return null;

  return {
    path,
    distance: distances.get(end),
  };
}

module.exports = { findShortestPath };

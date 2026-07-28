const Location = require('../models/Location');
const Edge = require('../models/Edge');
const { findShortestPath } = require('../utils/dijkstra');

// Average adult walking speed on a campus (meters per minute)
const WALK_SPEED_M_PER_MIN = 80;

// @desc   Get shortest walking route between two locations
// @route  GET /api/navigate?from=<id>&to=<id>&accessible=true|false
// @access Public
exports.navigate = async (req, res, next) => {
  try {
    const { from, to, accessible } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Both "from" and "to" location ids are required.',
      });
    }

    const [fromLoc, toLoc] = await Promise.all([
      Location.findById(from),
      Location.findById(to),
    ]);

    if (!fromLoc || !toLoc) {
      return res.status(404).json({
        success: false,
        message: 'One or both locations were not found.',
      });
    }

    if (from === to) {
      return res.status(400).json({
        success: false,
        message: 'Start and destination cannot be the same location.',
      });
    }

    const locations = await Location.find();
    const edges = await Edge.find();

    const accessibleOnly = accessible === 'true';
    const result = findShortestPath(locations, edges, from, to, accessibleOnly);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: accessibleOnly
          ? 'No accessible route found between these locations. Try disabling accessible-only mode.'
          : 'No route found between these locations. The campus map may need more connecting paths.',
      });
    }

    const locationMap = new Map(locations.map((l) => [String(l._id), l]));
    const routeLocations = result.path.map((id) => {
      const loc = locationMap.get(id);
      return {
        id: loc._id,
        name: loc.name,
        category: loc.category,
        x: loc.x,
        y: loc.y,
      };
    });

    const estimatedMinutes = Math.max(1, Math.round(result.distance / WALK_SPEED_M_PER_MIN));

    // Build simple turn-by-turn style directions
    const directions = routeLocations.map((loc, idx) => {
      if (idx === 0) return `Start at ${loc.name}.`;
      if (idx === routeLocations.length - 1) return `Arrive at ${loc.name}.`;
      return `Continue to ${loc.name}.`;
    });

    res.status(200).json({
      success: true,
      data: {
        from: fromLoc.name,
        to: toLoc.name,
        totalDistanceMeters: result.distance,
        estimatedMinutes,
        stops: routeLocations,
        directions,
      },
    });
  } catch (err) {
    next(err);
  }
};

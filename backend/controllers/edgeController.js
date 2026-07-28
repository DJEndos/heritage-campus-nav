const { validationResult } = require('express-validator');
const Edge = require('../models/Edge');
const Location = require('../models/Location');

// @desc   Get all edges (paths)
// @route  GET /api/edges
// @access Public
exports.getEdges = async (req, res, next) => {
  try {
    const edges = await Edge.find().populate('from to', 'name x y');
    res.status(200).json({ success: true, count: edges.length, data: edges });
  } catch (err) {
    next(err);
  }
};

// @desc   Create edge (path) between two locations
// @route  POST /api/edges
// @access Private/Admin
exports.createEdge = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { from, to } = req.body;

    if (from === to) {
      return res.status(400).json({
        success: false,
        message: 'A path cannot connect a location to itself.',
      });
    }

    const [fromLoc, toLoc] = await Promise.all([
      Location.findById(from),
      Location.findById(to),
    ]);

    if (!fromLoc || !toLoc) {
      return res.status(404).json({
        success: false,
        message: 'One or both locations do not exist.',
      });
    }

    const edge = await Edge.create(req.body);
    res.status(201).json({ success: true, data: edge });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete an edge
// @route  DELETE /api/edges/:id
// @access Private/Admin
exports.deleteEdge = async (req, res, next) => {
  try {
    const edge = await Edge.findById(req.params.id);
    if (!edge) {
      return res.status(404).json({ success: false, message: 'Path not found' });
    }
    await edge.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

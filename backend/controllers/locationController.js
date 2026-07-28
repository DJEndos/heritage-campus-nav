const { validationResult } = require('express-validator');
const Location = require('../models/Location');
const Edge = require('../models/Edge');

// @desc   Get all locations (supports ?search=&category=)
// @route  GET /api/locations
// @access Public
exports.getLocations = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const locations = await Location.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single location
// @route  GET /api/locations/:id
// @access Public
exports.getLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.status(200).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

// @desc   Create location
// @route  POST /api/locations
// @access Private/Admin
exports.createLocation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const location = await Location.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

// @desc   Update location
// @route  PUT /api/locations/:id
// @access Private/Admin
exports.updateLocation = async (req, res, next) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    res.status(200).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete location (also removes connected edges)
// @route  DELETE /api/locations/:id
// @access Private/Admin
exports.deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    await Edge.deleteMany({ $or: [{ from: location._id }, { to: location._id }] });
    await location.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

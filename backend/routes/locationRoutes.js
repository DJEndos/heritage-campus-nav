const express = require('express');
const { body } = require('express-validator');
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const locationValidators = [
  body('name').trim().notEmpty().withMessage('Location name is required'),
  body('x').isFloat({ min: 0, max: 100 }).withMessage('x must be between 0 and 100'),
  body('y').isFloat({ min: 0, max: 100 }).withMessage('y must be between 0 and 100'),
  body('category')
    .optional()
    .isIn([
      'Academic',
      'Administration',
      'Hostel',
      'Facility',
      'Recreation',
      'Health',
      'Gate',
      'Parking',
      'Landmark',
    ])
    .withMessage('Invalid category'),
];

router.get('/', getLocations);
router.get('/:id', getLocation);

router.post('/', protect, authorize('admin'), locationValidators, createLocation);
router.put('/:id', protect, authorize('admin'), updateLocation);
router.delete('/:id', protect, authorize('admin'), deleteLocation);

module.exports = router;

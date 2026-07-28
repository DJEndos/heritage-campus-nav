const express = require('express');
const { body } = require('express-validator');
const { getEdges, createEdge, deleteEdge } = require('../controllers/edgeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const edgeValidators = [
  body('from').isMongoId().withMessage('Valid "from" location id is required'),
  body('to').isMongoId().withMessage('Valid "to" location id is required'),
  body('distanceMeters')
    .isFloat({ min: 1 })
    .withMessage('distanceMeters must be a positive number'),
];

router.get('/', getEdges);
router.post('/', protect, authorize('admin'), edgeValidators, createEdge);
router.delete('/:id', protect, authorize('admin'), deleteEdge);

module.exports = router;

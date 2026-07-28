const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      unique: true,
      maxlength: 120,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    category: {
      type: String,
      enum: [
        'Academic',
        'Administration',
        'Hostel',
        'Facility',
        'Recreation',
        'Health',
        'Gate',
        'Parking',
        'Landmark',
      ],
      default: 'Landmark',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    // Coordinates on the schematic campus map (percentage-based, 0-100)
    x: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    y: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    floor: {
      type: String,
      default: 'Ground Floor',
    },
    isAccessible: {
      type: Boolean,
      default: true, // wheelchair / mobility accessible
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

LocationSchema.index({ name: 'text', description: 'text', code: 'text' });

module.exports = mongoose.model('Location', LocationSchema);

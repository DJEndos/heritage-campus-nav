const mongoose = require('mongoose');

const EdgeSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    distanceMeters: {
      type: Number,
      required: true,
      min: 1,
    },
    pathType: {
      type: String,
      enum: ['Walkway', 'Road', 'Stairs', 'Ramp'],
      default: 'Walkway',
    },
    // Whether this path is usable by wheelchair/mobility-impaired users
    isAccessible: {
      type: Boolean,
      default: true,
    },
    bidirectional: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

EdgeSchema.index({ from: 1, to: 1 });

module.exports = mongoose.model('Edge', EdgeSchema);

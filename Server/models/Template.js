const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    backgroundImageUrl: { type: String, required: true }, // Cloudinary URL
    thumbnailUrl: { type: String }, // Optional thumbnail
    canvasWidth: { type: Number, default: 1080 }, // Default story/poster size
    canvasHeight: { type: Number, default: 1920 },

    // We store the full Fabric.js JSON object here for perfect restoration
    elements: { type: mongoose.Schema.Types.Mixed },

    // Optional: Extract variables for easier querying if needed
    variables: [{ type: String }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);

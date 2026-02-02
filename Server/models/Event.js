const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },

    // The "Master Configuration"
    config: {
        backgroundImageUrl: { type: String, required: true },
        watermarkUrl: { type: String }, // Transparent PNG

        // Coordinate Mapping
        coordinates: {
            type: Object,
            default: {
                photo: { x: 0, y: 0, radius: 100 },
                name: { x: 0, y: 0 },
                designation: { x: 0, y: 0 },
                company: { x: 0, y: 0 }
            }
        },

        // Typography Locking
        typography: {
            type: Object,
            default: {
                fontFamily: 'Arial',
                name: { size: 40, color: '#000000' },
                designation: { size: 24, color: '#555555' },
                company: { size: 24, color: '#555555' }
            }
        },

        // Validation Rules
        validation: {
            nameLimit: { type: Number, default: 20 },
            companyLimit: { type: Number, default: 30 }
        },

        // New Features for Poster 5 Ws & Branding
        posterElements: {
            type: Object,
            default: {}
        },
        branding: {
            type: Object,
            default: {}
        },

        // Roles & Categories configuration
        roles: [{
            label: String, // e.g. Visitor, Exhibitor
            backgroundImageUrl: String, // Optional override
            badgeUrl: String // Optional badge overlay
        }]
    },

    // Leads & Data Governance
    leads: [{
        name: String,
        prefix: String, // Mr, Mrs, etc
        mobile: String,
        designation: String,
        company: String,
        role: String, // Selected role
        generatedPosterUrl: String,
        createdAt: { type: Date, default: Date.now }
    }],

    // Sponsorship Global Visibility
    sponsors: [{
        name: String,
        imageUrl: String,
        visible: { type: Boolean, default: true }
    }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);

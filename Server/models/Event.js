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
                photo: { x: 540, y: 400, radius: 150 }, // Standardized
                name: { x: 540, y: 1000 },
                designation: { x: 540, y: 1100 },
                company: { x: 540, y: 1200 },
                email: { x: 540, y: 1300 },
                website: { x: 540, y: 1400 }
            }
        },

        // Typography Locking
        typography: {
            type: Object,
            default: {
                fontFamily: 'Arial',
                name: { size: 60, color: '#000000', align: 'center', weight: 'bold' },
                designation: { size: 40, color: '#555555', align: 'center', weight: 'normal' },
                company: { size: 40, color: '#555555', align: 'center', weight: 'normal' },
                email: { size: 30, color: '#777777', align: 'center', weight: 'normal' },
                website: { size: 30, color: '#777777', align: 'center', weight: 'normal' }
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
        email: String,
        website: String,
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

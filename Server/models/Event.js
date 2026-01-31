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
            photo: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 },
                radius: { type: Number, default: 100 }
            },
            name: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 }
            },
            designation: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 }
            },
            company: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 }
            }
        },

        // Typography Locking
        typography: {
            fontFamily: { type: String, default: 'Arial' },
            name: {
                size: { type: Number, default: 40 },
                color: { type: String, default: '#000000' }
            },
            designation: {
                size: { type: Number, default: 24 },
                color: { type: String, default: '#555555' }
            },
            company: {
                size: { type: Number, default: 24 },
                color: { type: String, default: '#555555' }
            }
        },

        // Validation Rules
        validation: {
            nameLimit: { type: Number, default: 20 },
            companyLimit: { type: Number, default: 30 }
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

const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "poster-maker-backgrounds" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// @route   POST /api/templates
// @desc    Create a new template (upload background + save layout)
// @access  Admin
router.post('/', upload.single('backgroundImage'), async (req, res) => {
    try {
        const { name, elements, canvasWidth, canvasHeight } = req.body;
        let backgroundImageUrl = req.body.backgroundImageUrl;

        // If a file is uploaded, upload to Cloudinary
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            backgroundImageUrl = result.secure_url;
        }

        if (!backgroundImageUrl) {
            return res.status(400).json({ message: "Background image is required" });
        }

        // Elements might come as stringified JSON if using FormData
        let parsedElements = {};
        if (elements) {
            parsedElements = typeof elements === 'string' ? JSON.parse(elements) : elements;
        }

        // Extract variables from the objects
        const variables = [];
        if (parsedElements.objects) {
            parsedElements.objects.forEach(obj => {
                if (obj.type === 'i-text' || obj.type === 'text') {
                    const match = obj.text && obj.text.match(/{{(.*?)}}/);
                    if (match) {
                        variables.push(match[1]);
                    }
                }
            });
        }

        const newTemplate = new Template({
            name,
            backgroundImageUrl,
            canvasWidth: parseInt(canvasWidth) || 800,
            canvasHeight: parseInt(canvasHeight) || 1200,
            elements: parsedElements,
            variables
        });

        const savedTemplate = await newTemplate.save();
        res.status(201).json(savedTemplate);
    } catch (err) {
        console.error("Error saving template:", err);
        res.status(500).json({ message: err.message, error: err });
    }
});

// @route   GET /api/templates
// @desc    Get all templates
// @access  Public
router.get('/', async (req, res) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route   GET /api/templates/:id
// @desc    Get template by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: "Template not found" });
        res.json(template);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;

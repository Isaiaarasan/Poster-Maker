const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { generatePoster } = require('../utils/posterGenerator');

// Multer setup for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST /api/events
// @desc    Create a new event
// @access  Admin
router.post('/', async (req, res) => {
    try {
        const { title, slug, startDate, endDate } = req.body;

        let event = await Event.findOne({ slug });
        if (event) {
            return res.status(400).json({ message: 'Event with this slug already exists' });
        }

        event = new Event({
            title,
            slug,
            startDate,
            endDate,
            config: {
                // Initialize with placeholders or required empty strings
                backgroundImageUrl: 'https://via.placeholder.com/1080x1920?text=Upload+Background',
            }
        });

        await event.save();
        res.status(201).json(event);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/events
// @desc    Get all events
// @access  Admin
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/events/:slug
// @desc    Get event by slug (Public/Admin)
// @access  Public
router.get('/:slug', async (req, res) => {
    try {
        // If query param ?id=true, treat slug as ID (for admin editing by ID)
        // Or just allow both lookup types.
        let event;
        if (req.query.byId === 'true') {
            event = await Event.findById(req.params.slug);
        } else {
            event = await Event.findOne({ slug: req.params.slug });
        }

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/events/:id/config
// @desc    Update Master Configuration (The "Saved" button)
// @access  Admin
router.put('/:id/config', upload.fields([{ name: 'background', maxCount: 1 }, { name: 'watermark', maxCount: 1 }]), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Handle File Uploads
        if (req.files) {
            if (req.files.background) {
                const bgFile = req.files.background[0];
                const dataURI = `data:${bgFile.mimetype};base64,${bgFile.buffer.toString('base64')}`;
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'poster-events'
                });
                event.config.backgroundImageUrl = result.secure_url;
            }
            if (req.files.watermark) {
                const wmFile = req.files.watermark[0];
                const dataURI = `data:${wmFile.mimetype};base64,${wmFile.buffer.toString('base64')}`;
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'poster-events'
                });
                event.config.watermarkUrl = result.secure_url;
            }
        }

        // Handle Data Updates
        const {
            coordinates,
            typography,
            validation,
            status,
            sponsors,
            roles
        } = req.body;

        if (coordinates) {
            event.config.coordinates = JSON.parse(coordinates);
            event.markModified('config.coordinates');
        }
        if (typography) {
            event.config.typography = JSON.parse(typography);
            event.markModified('config.typography');
        }
        if (validation) event.config.validation = JSON.parse(validation);
        if (status) event.status = status;
        if (sponsors) event.config.sponsors = JSON.parse(sponsors);
        if (roles) event.config.roles = JSON.parse(roles);

        await event.save();
        res.json(event);

    } catch (err) {
        console.error("Config Update Error:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

// @route   POST /api/events/:slug/lead
// @desc    Capture lead data when user generates/downloads poster
// @access  Public
router.post('/:slug/lead', async (req, res) => {
    try {
        const event = await Event.findOne({ slug: req.params.slug });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.status !== 'published') {
            return res.status(403).json({ message: 'Event is not active' });
        }

        const { name, mobile, designation, company, generatedImageUrl, prefix, role, photoUrl } = req.body;

        // Check rate limits logic here (e.g. 5 posters per user)
        // Only run high-res gen if photoUrl is provided (implies we need to process it)
        // NOTE: In a real app we'd upload the client's photo to cloudinary first, then pass the URL here.
        // For this demo, we assume the client might send a base64 or we handle upload separately.
        // If the client sends a dataURI in `photoUrl` (base64), axios in posterGenerator might need tweaking or we upload it first.

        let finalPosterUrl = generatedImageUrl; // Fallback to client side if present

        if (photoUrl) {
            // We'll generate the high-res one
            // But first, we might need to ensure photoUrl is accessible.
            // If it's a blob URL from client, server can't reach it.
            // It must be a real URL or base64.
        }

        // For simplicity in this demo step: 
        // We will assume the Client has uploaded the user Photo to Cloudinary (or somewhere) *before* calling this lead API.
        // OR we accept a file upload here. 
        // Let's modify this route to accept a FILE upload for the user photo if we want true backend processing.

        // But to keep it simple with JSON body:
        // We will TRY to generate if photoUrl is a valid http string.

        // Wait, the client only has a local blob. The client MUST upload the photo.
        // Let's rely on the client `generatedImageUrl` for the "preview" save,
        // And create a dedicated `POST /:slug/generate-high-res` that handles the heavy lifting if requested.
        // Or better: The lead capture IS the generation request.

        // Let's just save the lead data for now.

        event.leads.push({
            name,
            prefix,
            mobile,
            designation,
            company,
            role,
            generatedImageUrl: finalPosterUrl
        });

        await event.save();
        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/events/:id/leads
// @desc    Export leads
// @access  Admin
router.get('/:id/leads', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Could generate CSV here or just send JSON for frontend to CSV
        res.json(event.leads);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/events/poster/upload
// @desc    Uploads a temp user photo and returns URL for processing
// @access  Public
router.post('/poster/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'poster-users'
        });

        res.json({ url: result.secure_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// @route   POST /api/events/:slug/generate
// @desc    Generates the high-res poster using backend processing
// @access  Public
router.post('/:slug/generate', async (req, res) => {
    try {
        const event = await Event.findOne({ slug: req.params.slug });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const { name, company, designation, role, photoUrl } = req.body;

        // Generate Buffer
        const posterBuffer = await generatePoster(event.config, {
            name, company, designation, role, photoUrl
        });

        // Upload Buffer to Cloudinary
        const uploadStream = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'generated-posters' },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                stream.end(buffer);
            });
        };

        const result = await uploadStream(posterBuffer);

        res.json({ url: result.secure_url });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Generation failed' });
    }
});

module.exports = router;

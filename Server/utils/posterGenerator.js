const sharp = require('sharp');
const axios = require('axios');
const { Readable } = require('stream');

async function fetchImageBuffer(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
}

// Helper to create circular mask
async function createCircularImage(buffer, size) {
    const circle = Buffer.from(
        `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
    );

    // Resize to target size first
    const resized = await sharp(buffer)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toBuffer();

    return sharp(resized)
        .composite([{ input: circle, blend: 'dest-in' }])
        .png()
        .toBuffer();
}

/**
 * Generates a high-res (300DPI equivalent) poster
 * @param {Object} config - Event configuration (coordinates, typography, images)
 * @param {Object} data - User data (photoUrl, name, company, designation, role)
 */
async function generatePoster(config, data) {
    try {
        // 1. Fetch Master Background
        // Check for Role-based background
        let bgUrl = config.backgroundImageUrl;
        if (data.role && config.roles) {
            const roleConfig = config.roles.find(r => r.label === data.role);
            if (roleConfig && roleConfig.backgroundImageUrl) {
                bgUrl = roleConfig.backgroundImageUrl;
            }
        }

        const bgBuffer = await fetchImageBuffer(bgUrl);
        const metadata = await sharp(bgBuffer).metadata();
        const width = 1080;
        const height = 1920;

        // 2. Fetch and Process User Photo
        let photoBuffer = null;
        if (data.photoUrl && config.coordinates.photo) {
            const rawPhoto = await fetchImageBuffer(data.photoUrl);
            const { radius } = config.coordinates.photo;
            const size = radius * 2; // Diameter
            photoBuffer = await createCircularImage(rawPhoto, size);
        }

        // 3. Create SVG Layer for Text
        const { typography, coordinates } = config;

        // Simple sanitization
        const escapeXml = (unsafe) => unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });

        const name = escapeXml(data.name || '');
        const designation = escapeXml(data.designation || '');
        const company = escapeXml(data.company || '');

        // Construct SVG for text overlay
        // We use absolute positioning inside the SVG to match the canvas coordinates
        const svgText = `
        <svg width="${width}" height="${height}">
            <style>
                .name { fill: ${typography.name.color}; font-family: ${typography.fontFamily}, sans-serif; font-size: ${typography.name.size}px; font-weight: bold; text-anchor: middle; }
                .designation { fill: ${typography.designation.color}; font-family: ${typography.fontFamily}, sans-serif; font-size: ${typography.designation.size}px; text-anchor: middle; }
                .company { fill: ${typography.company.color}; font-family: ${typography.fontFamily}, sans-serif; font-size: ${typography.company.size}px; text-anchor: middle; }
            </style>
            ${name ? `<text x="${coordinates.name.x}" y="${coordinates.name.y}" class="name">${name}</text>` : ''}
            ${designation ? `<text x="${coordinates.designation.x}" y="${coordinates.designation.y}" class="designation">${designation}</text>` : ''}
            ${company ? `<text x="${coordinates.company.x}" y="${coordinates.company.y}" class="company">${company}</text>` : ''}
        </svg>
        `;

        const textBuffer = Buffer.from(svgText);

        // 4. Composite List
        const composites = [];

        // Add Photo
        if (photoBuffer && config.coordinates.photo) {
            composites.push({
                input: photoBuffer,
                top: Math.round(config.coordinates.photo.y - config.coordinates.photo.radius),
                left: Math.round(config.coordinates.photo.x - config.coordinates.photo.radius)
            });
        }

        // Add Watermark
        if (config.watermarkUrl) {
            const wmBuffer = await fetchImageBuffer(config.watermarkUrl);
            // Access resizing if needed, or assume watermark is pre-sized to 1080x1920
            // Assuming watermark is full overlay for now
            composites.push({
                input: wmBuffer,
                top: 0,
                left: 0
            });
        }

        // Add Text Layer
        composites.push({
            input: textBuffer,
            top: 0,
            left: 0
        });

        // 5. Final Merge
        // Resize BG to standard 1080x1920 just in case
        const finalImageBuffer = await sharp(bgBuffer)
            .resize(width, height)
            .composite(composites)
            .png() // High quality PNG
            .toBuffer();

        return finalImageBuffer;

    } catch (err) {
        console.error("Poster Generation Error:", err);
        throw err;
    }
}

module.exports = { generatePoster };

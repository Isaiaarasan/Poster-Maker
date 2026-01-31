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
        const escapeXml = (unsafe) => unsafe ? String(unsafe).replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        }) : '';

        // Generate Text Elements Dynamically based on configured Coordinates
        let textElements = '';
        const styles = [];

        Object.keys(coordinates).forEach(key => {
            if (key === 'photo') return; // Skip photo
            if (!coordinates[key]) return;

            // Get value from data
            const textValue = escapeXml(data[key] || '');
            if (!textValue) return;

            const style = typography[key] || { size: 24, color: '#000000' };

            styles.push(`.${key} { fill: ${style.color}; font-family: ${typography.fontFamily}, sans-serif; font-size: ${style.size}px; font-weight: ${key === 'name' ? 'bold' : 'normal'}; text-anchor: middle; }`);

            textElements += `<text x="${coordinates[key].x}" y="${coordinates[key].y}" class="${key}">${textValue}</text>\n`;
        });

        const svgText = `
        <svg width="${width}" height="${height}">
            <style>
                ${styles.join('\n')}
            </style>
            ${textElements}
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
        const finalImageBuffer = await sharp(bgBuffer)
            .resize(width, height)
            .composite(composites)
            .png()
            .toBuffer();

        return finalImageBuffer;

    } catch (err) {
        console.error("Poster Generation Error:", err);
        throw err;
    }
}

module.exports = { generatePoster };

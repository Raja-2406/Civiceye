const exifr = require('exifr');

/**
 * Extracts latitude and longitude from an image buffer using EXIF data.
 * @param {Buffer} buffer - The image buffer to analyze.
 * @returns {Object|null} - An object with {lat, lng} or null if no GPS data is found.
 */
async function extractGPS(buffer) {
    try {
        // exifr.gps returns { latitude: Number, longitude: Number }
        const gpsData = await exifr.gps(buffer);
        if (gpsData && gpsData.latitude && gpsData.longitude) {
            return {
                lat: gpsData.latitude,
                lng: gpsData.longitude
            };
        }
        return null;
    } catch (error) {
        console.error("Error extracting EXIF GPS data:", error.message);
        return null;
    }
}

module.exports = { extractGPS };

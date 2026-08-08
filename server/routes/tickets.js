const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractGPS } = require('../utils/exifHelper');
const { analyzeImage } = require('../utils/geminiHelper');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
// Configure Multer for memory storage (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Final Upload Route for Step 4
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        const buffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        const { city, originalUserDescription } = req.body;

        // 1. Extract GPS Data (Hybrid System)
        let location = null;
        if (req.body.lat && req.body.lng) {
            console.log("Using explicit frontend GPS data...");
            location = {
                lat: parseFloat(req.body.lat),
                lng: parseFloat(req.body.lng)
            };
        } else {
            console.log("Extracting EXIF GPS data from image fallback...");
            location = await extractGPS(buffer);
        }

        if (!location || location.lat === null || location.lng === null || isNaN(location.lat) || isNaN(location.lng)) {
            return res.status(400).json({ error: "Location data is required. Please enable location services or upload an image with a geotag." });
        }

        // 2. Gemini AI Analysis
        console.log("Analyzing image with Gemini...");
        const aiAnalysis = await analyzeImage(buffer, mimeType);

        // 3. Upload to Cloudinary
        console.log("Uploading to Cloudinary...");
        const imageUrl = await uploadToCloudinary(buffer);

        // 4. Save to MongoDB
        console.log("Saving to database...");
        const newTicket = new Ticket({
            reportedBy: req.user.userId,
            city: city || 'Unknown',
            originalUserDescription,
            imageUrl,
            location: location || { lat: 0, lng: 0 },
            aiAnalysis,
            status: 'Open',
            assignedDepartment: 'Unassigned'
        });

        const savedTicket = await newTicket.save();

        res.status(201).json({ 
            message: "Ticket created successfully.",
            ticket: savedTicket 
        });

    } catch (error) {
        console.error("Error in ticket upload:", error);
        res.status(500).json({ error: 'Server error during upload.' });
    }
});

// Route to get all tickets (for Admin Dashboard later)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const tickets = await Ticket.find().populate('reportedBy', 'name').sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Route to get my tickets
router.get('/my-tickets', authMiddleware, async (req, res) => {
    try {
        const tickets = await Ticket.find({ reportedBy: req.user.userId }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Route to update a ticket (Status / Department)
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, assignedDepartment } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id, 
            { status, assignedDepartment }, 
            { new: true }
        );

        if (ticket && ticket.reportedBy) {
            await Notification.create({
                user: ticket.reportedBy,
                message: `Your ticket (${ticket._id.toString().substring(0,8)}) status is now ${status}.`
            });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

module.exports = router;

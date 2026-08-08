const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ 
  origin: ['http://localhost:5173', 'https://civiceye-frontend-eight.vercel.app'], 
  credentials: true 
}));
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.send('Smart Grievance Portal API is running');
});

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);


const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn("WARNING: MONGODB_URI is not defined in .env");
} else {
    mongoose.connect(MONGODB_URI)
      .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
      })
      .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
      });
}

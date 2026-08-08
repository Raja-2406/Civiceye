const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // In a real app this would likely be true, but depending on auth it can be optional
  },
  city: {
    type: String,
    required: true,
  },
  originalUserDescription: {
    type: String,
    required: false,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  aiAnalysis: {
    title: { type: String },
    description: { type: String },
    severity: { 
      type: String,
      enum: ['Low', 'Medium', 'High']
    }
  },
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Open',
  },
  assignedDepartment: {
    type: String,
    default: 'Unassigned',
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);

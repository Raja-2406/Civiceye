const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, and role are required.' });
    }

    if (role === 'admin') {
      if (!email.endsWith('@gov.in')) {
        return res.status(403).json({ error: "Unauthorized domain. Admin registration requires a @gov.in email address." });
      }
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'citizen'
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: { id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, and role are required.' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (role === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. You do not have administrator privileges." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '623498140904-44i46sdd6ie1i2or58bok106q3b78c40.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Domain Whitelisting
    const assignedRole = email.endsWith('@gov.in') ? 'admin' : 'citizen';

    let user = await User.findOne({ email });

    if (user) {
      if (user.role !== assignedRole) {
        user.role = assignedRole;
        await user.save();
      }
    } else {
      user = new User({
        name,
        email,
        role: assignedRole,
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: 'Server error during Google authentication' });
  }
});

module.exports = router;

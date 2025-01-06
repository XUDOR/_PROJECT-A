const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    // Get user info from auth token
    const username = req.user?.username || 'anonymous';
    
    // Create filename with pattern: username_timestamp_originalname
    const timestamp = Date.now();
    const originalName = file.originalname;
    const filename = `${username}_${timestamp}_${originalName}`;
    
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage, // Use our custom storage config instead of 'dest'
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  },
});

// Import constants
const { PROJECT_B_URL, PROJECT_F_URL } = require('../../config/const');
const PROJECT_Z_URL = process.env.PROJECT_Z_URL;

// Middleware
const authenticateToken = require('../middleware/authenticateToken');

// ------------------- HELPER FUNCTIONS ------------------- //

/**
 * Notify Project F
 * @param {string} message - Notification message
 * @param {string} status - Status level (success, error, info)
 * @param {string} source - Source of the notification
 * @param {object} details - Additional details to include
 */
const notifyProjectF = async (message, status, source, details = {}) => {
  try {
    await axios.post(PROJECT_F_URL, { message, status, source, ...details });
  } catch (error) {
    console.error('Failed to notify Project F:', error.message);
  }
};

// ------------------- ROUTES ------------------- //

// ------------------- API STATUS ROUTE ------------------- //
router.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    version: '1.0',
    message: 'Project A is running',
  });
});

// ------------------- HEALTHCHECK ------------------- //
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Project A is up and running',
    timestamp: new Date().toISOString(),
    service: 'Project A',
  });
});

// ------------------- AUTHENTICATION ------------------- //

/**
 * SIGNUP ROUTE
 */
router.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, name, email, password, accountType } = req.body;
    if (!username || !name || !email || !password || !accountType) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const response = await axios.post(`${PROJECT_Z_URL}/api/auth/signup`, {
      username,
      name,
      email,
      password,
      accountType,
    });

    await notifyProjectF(
      `Account created for ${username} (${email})`,
      'success',
      'Project A'
    );

    res.status(200).json({ message: 'Account created successfully', data: response.data });
  } catch (error) {
    console.error('Signup error:', error.message);
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || 'Internal server error';
    await notifyProjectF(
      `Signup failed for ${req.body?.email}. ${errorMessage}`,
      'error',
      'Project A'
    );
    res.status(status).json({ error: errorMessage });
  }
});

/**
 * LOGIN ROUTE
 */
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const response = await axios.post(`${PROJECT_Z_URL}/api/auth/login`, {
      email,
      password,
    });

    const { token, user } = response.data;
    await notifyProjectF(
      `User logged in: ${user.username}`,
      'success',
      'Project A'
    );

    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error('Login error:', error.message);
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || 'Internal server error';
    await notifyProjectF(
      `Login failed for ${req.body?.email}. ${errorMessage}`,
      'error',
      'Project A'
    );
    res.status(status).json({ error: errorMessage });
  }
});

// ------------------- PROFILE SUBMISSION ------------------- //

router.post('/users', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, location, skills, profile_summary } = req.body;
    if (!name || !email || !phone || !address || !location) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    const response = await axios.post(PROJECT_B_URL, {
      name,
      email,
      phone,
      address,
      location,
      skills: Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim()),
      profile_summary,
      userId: req.user.id,
    });

    await notifyProjectF(
      `Profile submitted for ${name} (${email})`,
      'success',
      'Project A'
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: response.data,
    });
  } catch (error) {
    console.error('Profile submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit profile' });
  }
});

// ------------------- FILE UPLOAD ------------------- //

router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = await fs.readFile(req.file.path);
    // Add additional validation or processing if needed

    await notifyProjectF(
      `Resume uploaded by ${req.user.username}: ${req.file.originalname}`,
      'success',
      'Project A'
    );

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    if (req.file) {
      await fs.unlink(req.file.path);
    }
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// ------------------- RESUME RETRIEVAL ------------------- //

router.get('/resumes', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadDir);

    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);
        
        // Get the mimetype based on file extension
        const ext = path.extname(file).toLowerCase();
        const mimeTypes = {
          '.pdf': 'application/pdf',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.doc': 'application/msword'
        };

        return {
          filename: file,
          originalname: file, // Use filename as originalname
          size: stats.size,
          mimetype: mimeTypes[ext] || 'application/octet-stream',
          uploadDate: stats.mtime
        };
      })
    );

    res.json({ files: fileDetails });
  } catch (error) {
    console.error('Error retrieving resumes:', error.message);
    res.status(500).json({ error: 'Failed to retrieve resumes' });
  }
});

// ------------------- JOB DATA ------------------- //

router.post('/api/receive-jobs', authenticateToken, async (req, res) => {
  try {
    const jobData = req.body;
    await notifyProjectF(
      'Received job data from Project F',
      'info',
      'Project A'
    );

    res.status(200).json({ message: 'Job data received successfully', data: jobData });
  } catch (error) {
    console.error('Job data error:', error.message);
    res.status(500).json({ error: 'Failed to process job data' });
  }
});

module.exports = router;

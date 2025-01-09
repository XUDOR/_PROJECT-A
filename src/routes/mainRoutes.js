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



//Unified upload endpoint
router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        const isPublic = !req.user;
        const fileData = req.file;

        if (!fileData) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const metadata = {
            uploadType: isPublic ? 'public' : 'user',
            username: req.user?.username || null,
            ipAddress: req.ip,
            filePath: fileData.path,
            uploadTime: new Date().toISOString(),
        };

        // Send file to Project Z for scanning
        console.log('Using Project Z URL:', PROJECT_Z_URL);

        const scanResponse = await axios.post(`${PROJECT_Z_URL}/api/scan`, {
            filePath: metadata.filePath,
            metadata,
        });

        if (!scanResponse.data.success) {
            if (isPublic) await fs.unlink(fileData.path); // Delete public file on failure
            return res.status(400).json({ error: 'File failed validation', details: scanResponse.data });
        }

        // If public, schedule deletion
        if (isPublic) {
            setTimeout(async () => {
                try {
                    await fs.unlink(fileData.path);
                    console.log(`Public file ${fileData.path} deleted.`);
                } catch (err) {
                    console.error(`Failed to delete file: ${err.message}`);
                }
            }, 3600 * 1000); // Delete after 1 hour
        }

        res.json({ message: 'File uploaded and scanned successfully', metadata, scanResult: scanResponse.data });
    } catch (error) {
        console.error('Upload error:', error.message);
        if (req.file) {
            await fs.unlink(req.file.path); // Cleanup uploaded file on error
        }
        res.status(500).json({ error: 'File upload failed', details: error.message });
    }
});
















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

// Utility Functions

/**
 * Generates a random session hash (10 characters) for public uploads.
 */
function generateSessionHash() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 10 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

/**
* Schedules deletion of a file after the specified time-to-live (TTL).
* @param {string} filePath - The path to the file to delete.
* @param {number} ttl - Time to live in seconds.
*/
function scheduleFileDeletion(filePath, ttl) {
  setTimeout(async () => {
      try {
          await fs.unlink(filePath);
          console.log(`File ${filePath} deleted after session expired.`);
      } catch (error) {
          console.error(`Failed to delete file ${filePath}:`, error.message);
      }
  }, ttl * 1000);
}


// ------------------- FILE UPLOAD ------------------- //
console.log('Initializing /upload route');
router.post('/upload', authenticateToken.optional, upload.single('resume'), async (req, res) => {
  const user = req.user || null;
  const isPublic = !user;
  const fileData = req.file;

  console.log("1. User data:", user); // Log user data (or null if not logged in)
  console.log("2. Is public upload:", isPublic); // Log whether this is a public upload
  console.log("3. File data from Multer:", fileData); // Log the file data from Multer

  if (!fileData) {
      console.error("4. No file uploaded."); // Log error if no file was uploaded
      return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
      // Metadata for public or private upload
      const metadata = {
          username: user?.username || null,
          sessionHash: isPublic ? generateSessionHash() : null,
          timestamp: Date.now(),
          filename: fileData.originalname,
      };

      console.log("5. Metadata prepared:", metadata); // Log prepared metadata

      // Send to Project Z for scanning
      console.log("6. Sending file to Project Z for scanning...");
      const scanResponse = await axios.post(`${PROJECT_Z_URL}/api/scan`, {
          file: fileData, // Ensure this is correctly handled in Project Z
          metadata,
      });

      console.log("7. Scan response from Project Z:", scanResponse.data); // Log response from Project Z

      if (!scanResponse.data.success) {
          console.error("8. File failed validation during scanning.");
          await fs.unlink(fileData.path); // Delete file if scan fails
          return res.status(400).json({ error: 'File failed validation' });
      }

      // Save file in public or private folder
      const savePath = isPublic
          ? path.join(__dirname, '../../uploads/public', `${metadata.sessionHash}_${fileData.originalname}`)
          : path.join(__dirname, '../../uploads/private', user.username, fileData.originalname);

      console.log("9. Saving file to:", savePath); // Log where the file is being saved
      await fs.rename(fileData.path, savePath);

      // Schedule deletion for public uploads
      if (isPublic) {
          console.log("10. Scheduling file deletion for public upload.");
          scheduleFileDeletion(savePath, 3600);
      }

      // Notify Project F
      console.log("11. Notifying Project F of successful upload.");
      await notifyProjectF(
          `${isPublic ? 'Public' : 'Private'} resume uploaded`,
          'success',
          'Project A',
          metadata
      );

      res.json({ message: 'File uploaded successfully', metadata });
  } catch (error) {
      console.error("Upload error:", error.message); // Log the error
      if (fileData) {
          console.log("12. Cleaning up file due to error.");
          await fs.unlink(fileData.path); // Cleanup uploaded file on error
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

// ------------------- RESUME DELETION ------------------- //


router.delete('/resumes/:filename', authenticateToken, async (req, res) => {
  const { filename } = req.params;

  try {
      const filePath = path.join(__dirname, '../../uploads', filename);
      await fs.unlink(filePath);

      await notifyProjectF(
          `Resume deleted by ${req.user.username}: ${filename}`,
          'info',
          'Project A'
      );

      res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete resume' });
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

// mainRoutes.js

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Import constants
const { PROJECT_B_URL, PROJECT_F_URL } = require('../../config/const');

// Read PROJECT_Z_URL from environment (.env)
const PROJECT_Z_URL = process.env.PROJECT_Z_URL;

// JWT authentication middleware
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

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
      service: 'Project A'
  });
});

// ------------------- AUTHENTICATION ------------------- //

/**
 * SIGNUP ROUTE
 * Expects { username, name, email, password, accountType }
 * Forwards to Project Z at /api/auth/signup
 */
router.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, name, email, password, accountType } = req.body;
    console.log('PROJECT_Z_URL:', process.env.PROJECT_Z_URL); // Add this
        console.log('Signup payload:', req.body); // Add this too

    if (!username || !name || !email || !password || !accountType) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    console.log('Signup request received:', { username, name, email, accountType });

    // Forward raw user details to Project Z for processing
    const response = await axios.post(`${PROJECT_Z_URL}/api/auth/signup`, {
      username,
      name,
      email,
      password,
      accountType,
    });

    // Check for a successful response from Project Z
    if (response.status === 200) {
      console.log('Account successfully created in Project Z:', response.data);

      // Notify Project F about the new account creation
      await axios.post(PROJECT_F_URL, {
        message: `Account created for ${username} (${email}).`,
        status: 'success',
        source: 'Project A',
      });

      console.log('Notification sent to Project F for new account creation.');

      // Send the response back to the client
      return res.status(200).json({
        message: 'Account created successfully.',
        data: response.data,
      });
    } else {
      console.error('Error from Project Z:', response.data);

      // Notify Project F about the signup failure
      await axios.post(PROJECT_F_URL, {
        message: `Signup failed for ${email}. (Error from Z)`,
        status: 'error',
        source: 'Project A',
      });

      return res.status(response.status).json({
        error: response.data.error || 'Unknown error from Project Z.',
      });
    }
  } catch (error) {
    console.error('Signup error:', error.message);

    // Handle errors from Project Z or Project F
    if (error.response) {
      // Error response from the forwarded service
      console.error('Error response from Project Z:', error.response.data);

      // Notify Project F about the signup failure
      await axios.post(PROJECT_F_URL, {
        message: `Signup failed for ${req.body?.email} (Project Z error).`,
        status: 'error',
        source: 'Project A',
      });

      return res.status(error.response.status).json({
        error: error.response.data.error || 'Error from Project Z.',
      });
    }

    // General error fallback
    await axios.post(PROJECT_F_URL, {
      message: `Signup failed for ${req.body?.email}. Internal server error.`,
      status: 'error',
      source: 'Project A',
    });

    res.status(500).json({ error: 'Signup failed due to an internal server error.' });
  }
});

/**
 * LOGIN ROUTE
 * Expects { email, password }
 * Forwards to Project Z at /api/auth/login
 */
router.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            console.log('[Validation Error] Missing email or password in request payload.');
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            console.log('[Validation Error] Invalid email format:', email);
            return res.status(400).json({ error: 'Invalid email format.' });
        }
        if (password.length < 6) {
            console.log('[Validation Error] Password too short:', { email });
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        console.log('[Request Initiated] Forwarding login request to Project Z:', { email });

        // Forward login credentials to Project Z
        const response = await axios.post(`${PROJECT_Z_URL}/api/auth/login`, {
            email,
            password,
        });

        console.log('[Response Received] Project Z response:', {
            status: response.status,
            data: response.data,
        });

        if (response.status === 200) {
            const { token, user } = response.data;

            // Notify Project F
            console.log('[Notification] Sending login success notification to Project F:', {
                user: user?.username || email,
            });
            await axios.post(PROJECT_F_URL, {
                message: `User logged in: ${user?.username || email}`,
                status: 'success',
                source: 'Project A',
            });

            console.log('[Login Success] Returning token and user info to frontend:', {
                user: user?.username,
            });
            return res.status(200).json({
                message: 'Login successful.',
                token,
                user,
            });
        } else {
            console.error('[Unexpected Response] Non-200 status from Project Z:', {
                status: response.status,
                error: response.data.error,
            });

            await axios.post(PROJECT_F_URL, {
                message: `Login attempt failed for ${email} (Z returned status: ${response.status}).`,
                status: 'error',
                source: 'Project A',
            });

            return res.status(response.status).json({
                error: response.data.error || 'Unknown error from Project Z.',
            });
        }
    } catch (error) {
        console.error('[Login Error] An error occurred:', error.message);

        if (error.response) {
            console.error('[Error Response from Project Z] Details:', {
                status: error.response.status,
                data: error.response.data,
            });

            await axios.post(PROJECT_F_URL, {
                message: `Login error for ${req.body.email}: ${error.response.data.error}`,
                status: 'error',
                source: 'Project A',
            });

            return res.status(error.response.status).json({
                error: error.response.data.error || 'Error from Project Z.',
            });
        }

        // General error fallback
        console.error('[General Error] Internal server error occurred during login for:', email);
        await axios.post(PROJECT_F_URL, {
            message: `Login error for ${req.body.email}. Internal server error.`,
            status: 'error',
            source: 'Project A',
        });

        res.status(500).json({ error: 'Login failed due to an internal server error.' });
    }
});

// ------------------- FORM SUBMISSION ROUTE ------------------- //
// Protect this route using JWT
router.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, location, skills, profile_summary } = req.body;
    console.log('Received data:', req.body);

    // Forward the request to Project B
    const response = await axios.post(PROJECT_B_URL, {
      name,
      email,
      phone,
      address,
      location,
      skills,
      profile_summary,
    });

    console.log('Response from Project B:', response.data);

    // If success, notify F
    await axios.post(PROJECT_F_URL, {
      message: `Database submission success for user ${name} (${email}).`,
      status: 'success',
      source: 'Project A',
    });

    // Return the response from Project B
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error forwarding data to Project B:', error.message);

    // If fail, notify F
    await axios.post(PROJECT_F_URL, {
      message: `Database submission error for user ${req.body?.name} (${req.body?.email}).`,
      status: 'error',
      source: 'Project A',
      details: error.message,
    });

    res.status(500).json({ error: 'Failed to forward data to Project B.' });
  }
});

// ------------------- RECEIVE JOB DATA FROM PROJECT F ------------------- //
// Protect this route using JWT
router.post('/api/receive-jobs', authenticateToken, async (req, res) => {
  try {
    const jobData = req.body;
    console.log('Received job data from Project F:', jobData);

    // Optionally notify F about the received job data
    await axios.post(PROJECT_F_URL, {
      message: 'Received job data from F successfully.',
      status: 'info',
      source: 'Project A',
    });

    res.status(200).json({ message: 'Job data received successfully', data: jobData });
  } catch (error) {
    console.error('Error receiving job data:', error.message);

    // Notify F about the error
    await axios.post(PROJECT_F_URL, {
      message: 'Error receiving job data from F.',
      status: 'error',
      source: 'Project A',
      details: error.message,
    });

    res.status(500).json({ error: 'Failed to receive job data.' });
  }
});

// ------------------- NOTIFY PROJECT F ------------------- //
// Protect this route using JWT
router.post('/api/notify', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    await axios.post(PROJECT_F_URL, { message });
    console.log('Notification sent to Project F:', message);

    res.status(200).json({ message: 'Notification sent to Project F successfully.' });
  } catch (error) {
    console.error('Error notifying Project F:', error.message);

    // Notify F about the error
    await axios.post(PROJECT_F_URL, {
      message: 'Error notifying Project F.',
      status: 'error',
      source: 'Project A',
      details: error.message,
    });

    res.status(500).json({ error: 'Failed to send notification to Project F.' });
  }
});

module.exports = router;

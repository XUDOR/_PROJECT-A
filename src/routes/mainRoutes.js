const express = require('express');
const axios = require('axios'); // For making HTTP requests
const { PROJECT_B_URL, PROJECT_F_URL } = require('../../config/const'); // Import constants
const PROJECT_Z_URL = process.env.PROJECT_Z_URL;
const authenticateToken = require('../middleware/authenticateToken'); // Import middleware

const jwt = require('jsonwebtoken');

const router = express.Router();

// ------------------- API STATUS ROUTE ------------------- //
router.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        version: '1.0',
        message: 'Project A is running'
    });
});

// ---------------- HEALTHCHECK ---------------- //
router.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Project A is up and running' });
});

// ---------------- AUTHENTICATION ---------------- //

/// Signup route
router.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, accountType } = req.body;

        // Validate required fields
        if (!name || !email || !password || !accountType) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        console.log('Signup request received:', { name, email, accountType });

        // Forward raw user details to Project Z for processing
        const response = await axios.post(`${PROJECT_Z_URL}/api/auth/signup`, {
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
                message: `Account created for ${name} (${email}).`,
            });

            console.log('Notification sent to Project F for new account creation.');

            // Send the response back to the client
            return res.status(200).json({
                message: 'Account created successfully.',
                data: response.data,
            });
        } else {
            console.error('Error from Project Z:', response.data);
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
            return res.status(error.response.status).json({
                error: error.response.data.error || 'Error from Project Z.',
            });
        }

        // General error fallback
        res.status(500).json({ error: 'Signup failed due to an internal server error.' });
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
            profile_summary
        });

        console.log('Response from Project B:', response.data);

        // Return the response from Project B
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error forwarding data to Project B:', error.message);
        res.status(500).json({ error: 'Failed to forward data to Project B.' });
    }
});






// ------------------- RECEIVE JOB DATA FROM PROJECT F ------------------- //
// Protect this route using JWT
router.post('/api/receive-jobs', authenticateToken, async (req, res) => {
    try {
        const jobData = req.body;
        console.log('Received job data from Project F:', jobData);
        res.status(200).json({ message: 'Job data received successfully', data: jobData });
    } catch (error) {
        console.error('Error receiving job data:', error.message);
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
        res.status(500).json({ error: 'Failed to send notification to Project F.' });
    }
});

module.exports = router;

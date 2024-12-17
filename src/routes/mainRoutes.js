const express = require('express');
const axios = require('axios'); // For making HTTP requests
const { PROJECT_B_URL, PROJECT_F_URL } = require('../../config/const'); // Import URLs from const.js
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


// ------------------- FORM SUBMISSION ROUTE ------------------- //
// POST route to handle form submissions and forward to Project B
router.post('/api/users', async (req, res) => {
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

        // Return the response from Project B
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error forwarding data to Project B:', error.message);
        console.error('Error details:', error.response?.data || error.stack);
        res.status(500).json({ error: 'Failed to forward data to Project B.' });
    }
});

// ------------------- RECEIVE JOB DATA FROM PROJECT F ------------------- //
router.post('/api/receive-jobs', async (req, res) => {
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
// POST route to send a notification to Project F
router.post('/api/notify', async (req, res) => {
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

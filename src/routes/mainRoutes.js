///  mainRoutes  >>. PROJECT A

const express = require('express');
const axios = require('axios'); // For making HTTP requests
const router = express.Router();

// POST route to handle form submissions
router.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone, address, location, skills, profile_summary } = req.body;
        console.log('Received data:', req.body);

        // Forward the request to Project B
        const response = await axios.post('http://localhost:3002/api/users', {
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

// Route to receive job data from Project F
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



module.exports = router;

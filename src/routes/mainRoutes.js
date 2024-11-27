const express = require('express');
const axios = require('axios'); // For making HTTP requests
const router = express.Router();

// POST route to handle form submissions
router.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone, address, location, skills, profile_summary } = req.body;

        // Forward the request to Project B
        const response = await axios.post('http://localhost:3000/api/users', {
            name,
            email,
            phone,
            address,
            location,
            skills,
            profile_summary,
        });

        // Return the response from Project B
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error forwarding data to Project B:', error.message);
        res.status(500).json({ error: 'Failed to submit user' });
    }
});

module.exports = router;

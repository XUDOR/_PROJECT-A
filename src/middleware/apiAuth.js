const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        // Log the incoming request
        console.log('Signup request received:', {
            ...req.body,
            password: '***' // Don't log the actual password
        });

        const { username, name, email, password, accountType } = req.body;
        
        // Validate all required fields
        if (!username || !name || !email || !password || !accountType) {
            console.log('Missing required fields:', {
                username: !username,
                name: !name,
                email: !email,
                password: !password,
                accountType: !accountType
            });
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Forward to Project Z with all fields
        const response = await axios.post(`${process.env.PROJECT_Z_URL}/api/auth/signup`, {
            username,
            name,
            email,
            password,
            accountType
        });

        console.log('Signup successful');
        res.json(response.data);
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
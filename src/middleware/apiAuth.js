const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

const PROJECT_Z_URL = process.env.PROJECT_Z_URL;

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


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('[Validation Error] Missing email or password.');
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        console.log('[Forwarding to Project Z] Email:', email);
        const response = await axios.post(`${PROJECT_Z_URL}/api/auth/login`, { email, password });

        console.log('[Response from Project Z]:', response.data);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('[Login Error]:', error.message);

        if (error.response) {
            console.error('[Error Response from Project Z]:', error.response.data);
            return res.status(error.response.status).json({
                error: error.response.data.error || 'Error from Project Z.',
            });
        }

        res.status(500).json({ error: 'Login failed.' });
    }
});



module.exports = router;
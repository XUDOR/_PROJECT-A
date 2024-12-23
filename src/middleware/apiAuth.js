// apiAuth.js


const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, accountType } = req.body;
        const response = await axios.post(`${process.env.PROJECT_Z_URL}/api/auth/signup`, {
            name, email, password, accountType
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
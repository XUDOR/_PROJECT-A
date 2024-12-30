require('dotenv').config();
const express = require('express');
const axios = require('axios');      
const path = require('path');
const bodyParser = require('body-parser');
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./middleware/apiAuth');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const constants = require('../config/const.js'); // Import constants only once

const app = express();

// Middleware setup
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Expose constants for client use
app.get('/api/constants', (req, res) => {
    res.json(constants);
});

// Routes
app.use('/api', mainRoutes); // Will handle /api/* except auth
app.use('/api/auth', authRoutes); // Will handle auth routes

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Notify Project F
const notifyProjectF = async () => {
    try {
        await axios.post('http://localhost:3006/api/notifications', {
            message: 'Project A is up and running'
        });
        console.log('Notified Project F: Project A is running');
    } catch (error) {
        console.error('Failed to notify Project F:', error.message);
    }
};

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Project A is running on http://localhost:${PORT}`);
    notifyProjectF();
});

module.exports = app;

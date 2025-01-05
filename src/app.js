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



// Routes
app.use('/api', mainRoutes); // Will handle /api/* except auth
app.use('/api/auth', authRoutes); // Will handle auth routes



// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Expose constants for client use
app.get('/api/constants', (req, res) => {
    res.json({
        PROJECT_F_NOTIFICATIONS_URL: constants.PROJECT_F_URL,
        // Add other constants explicitly here if needed
    });
});




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


// Add a new POST route for /api/notify
app.post('/api/notify', (req, res) => {
    const { message, status, source, timestamp } = req.body;

    // Log the notification details (or handle them as needed)
    console.log(`[NOTIFICATION RECEIVED]`, {
        message,
        status,
        source,
        timestamp
    });

    // Respond back with success
    res.status(200).json({ message: 'Notification received successfully' });
});




// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Project A is running on http://localhost:${PORT}`);
    notifyProjectF();
});

module.exports = app;

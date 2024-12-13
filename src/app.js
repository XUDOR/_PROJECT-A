// app.js >> PROJECT A

const express = require('express');
const axios = require('axios');       // Import axios for HTTP requests
require('dotenv').config();           // Load environment variables from .env file

console.log('Loaded PORT:', process.env.PORT);

const path = require('path');
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const mainRoutes = require('./routes/mainRoutes'); // Import your routes

const app = express();

// Define the PORT variable
const PORT = process.env.PORT || 3001;

// Middleware for serving static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to parse JSON and form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use the main routes
app.use(mainRoutes);

// Basic route for serving index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Notify Project F that Project A is running
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

// Start the server
app.listen(PORT, () => {
    console.log(`Project A is running on http://localhost:${PORT}`);
    notifyProjectF();  // Call the notification function here
});

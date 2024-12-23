const express = require('express');
const axios = require('axios');      
require('dotenv').config();          

const path = require('path');
const bodyParser = require('body-parser');
const mainRoutes = require('./routes/mainRoutes');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Define the PORT variable
const PORT = process.env.PORT || 3001;

// Middleware for serving static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to parse JSON and form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use the main routes with explicit root path
app.use('/', mainRoutes);

// Debug: Log registered routes
console.log('Registered Routes:');
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
    }
});

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
    notifyProjectF();
});
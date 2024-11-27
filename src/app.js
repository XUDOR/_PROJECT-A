const express = require('express');
require('dotenv').config(); // Load environment variables from .env file
const path = require('path');
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const mainRoutes = require('./routes/mainRoutes'); // Import your routes

const app = express();

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

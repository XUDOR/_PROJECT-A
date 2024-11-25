const express = require('express');
require('dotenv').config(); // Load environment variables from .env file
const path = require('path');

const app = express();

// Middleware for static files
app.use(express.static(path.join(__dirname, '../public')));

// Basic route for serving index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

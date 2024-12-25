require('dotenv').config();
const express = require('express');
const axios = require('axios');      
const path = require('path');
const bodyParser = require('body-parser');
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./middleware/apiAuth');
const cookieParser = require('cookie-parser');
const cors = require('cors');

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

// Routes
app.use('/api', mainRoutes); // Will handle /api/* except auth
app.use('/api/auth', authRoutes); // Will handle auth routes



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Project F notification
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Project A is running on http://localhost:${PORT}`);
    notifyProjectF();
});

module.exports = app;
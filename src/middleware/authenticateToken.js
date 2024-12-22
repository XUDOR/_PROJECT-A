// authenticateToken.js


const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authenticateToken;
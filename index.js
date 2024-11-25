const express = require('express');
require('dotenv').config(); // Load environment variables from .env file

const app = express();

app.get('/', (req, res) => {
    res.send('Hello, _PROJECT-A!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

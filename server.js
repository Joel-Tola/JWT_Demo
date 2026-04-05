require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { connectDB, testConnection } = require('./config/db');
const authRoutes = require('./routers/auth');
const profileRoutes = require('./routers/profile');

const app = express();

// Connect to MongoDB
// connectDB();
testConnection();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Base Route
app.get('/', (req, res) => {
    res.send('JWT Auth API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
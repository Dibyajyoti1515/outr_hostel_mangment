const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Connection pool for handling 1400+ students
            maxPoolSize: 50,
            minPoolSize: 10,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
        });
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Graceful disconnect
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected on app termination');
    process.exit(0);
});

module.exports = connectDB;
const dns = require('dns');

// Fix DNS resolution for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('MongoDB Connected Successfully!');

    } catch (error) {
        console.log('MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    connectDB();
}

module.exports = connectDB;
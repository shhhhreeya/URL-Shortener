const dns = require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
require('dotenv').config();

async function connectDB(url = process.env.MONGODB_URI) {
    if (!url) {
        throw new Error('MONGODB_URI is not defined. Add it to your .env file.');
    }

    return mongoose.connect(url);
}

module.exports = {
    connectDB,
};
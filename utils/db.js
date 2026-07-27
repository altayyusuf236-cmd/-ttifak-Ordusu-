const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB bağlandı');
  } catch (err) {
    console.error('❌ MongoDB bağlantı hatası:', err);
  }
};

module.exports = { connectDB };
require('dotenv').config()
const mongoose=require("mongoose")

exports.connectToDB=async()=>{
    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        console.log('Using MongoDB URI:', process.env.MONGO_URI.replace(/:[^:@]*@/, ':****@'));

        // Enhanced connection options for better stability
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
        });
        console.log('✅ Connected to MongoDB Atlas successfully');
    } catch (error) {
        console.log('❌ Failed to connect to MongoDB Atlas:', error.message);
      
        process.exit(1);
    }
}
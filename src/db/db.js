import {DB_NAME} from '../constants.js'
import mongoose from 'mongoose'

const connectDB = async() => {
    try{
       const connectionInstance =  await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
       console.log(`MongoDB connected successfully: ${connectionInstance.connection.host}`)
    }
    catch(err){
        console.log("Database connection failed", err);
        process.exit(1);
       
    }
}

export default connectDB;
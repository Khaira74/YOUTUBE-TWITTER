import mongoose from "mongoose"

import { DB_NAME } from "../constants.js"


const connectDB =async()=>{
    try {

    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
        //  appends the database name to the URI, forming something like "mongodb://localhost:27017/mydb”    
        
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1)
        //.         process.exit(1) Immediately terminates the Node.js process with exit code 1 (a non-zero code indicates failure).
// This is common in startup code: if the DB can’t connect, the app should not continue running.


    }
}


export default connectDB
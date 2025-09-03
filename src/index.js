import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})

import connectDB from "./db/index.js";
import { app } from "./app.js";

// require('dotenv').config()//old method 
// instread of uinsg require we use this more optimaised feature 
//METHOD 2
// improting direclty from db folder 


  // as connectdb is promise so we can use catch and then

//   What are route handlers?

// A route handler is just the function that runs when a request hits a specific path and method in your
//  Express app. For example, in app.get('/profile', (req, res) => { ... }), the function (req, res) => 
//     { ... } is the route handler. It receives the request, reads things like req.cookies or req.params,
//   and sends a response with res.send/res.json/res.status. Think “when someone asks GET /profile, run
//    this function.”
// below is a route handler
connectDB().then(()=>{
    app.listen(process.env.PORT || 6000,()=>{
    console.log(`server is ruiing at ${process.env.PORT}`)
    })
}).catch((err)=>{
    console.log("MongoDB connection failed")
})




// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// METHOD  1 OF CONNECTING
// if e function thats runs immiditely

// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log(error)
//             throw error

//         })


//         app.listen(process.env.PORT,()=>{
//             console.log(`listening at${process.env.PORT}`)
//         })
        
//     } catch (error) {
//         console.log(error)
//         throw error
        
//     }
// })()

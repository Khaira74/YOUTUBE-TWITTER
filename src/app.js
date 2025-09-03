import express from "express"

import cors from "cors"
import cookieParser  from "cookie-parser"


const app=express()


app.use(cors({
    origin:process.env.CORS_ORIGIN, 

    // origin  tells CORS which frontend is allowed to access your backend.In this case, only requests coming 
    // from a browser page loaded from http://example.com will be accepted.Any request from other origins
    //  (e.g. http://localhost:3000, http://evil.com) will be blocked by the browser.
    credentials:true
// By default, browsers do not send credentials (cookies, Authorization headers, etc.) in cross-origin 
// requests.
// When you set: credentials: true ,, The CORS middleware tells the browser it’s okay to send credentials
//  along with the request and to expose them in the response.

}))
// body data
app.use(express.json({limit:"16kb"}))
// by url
app.use(express.urlencoded({extended:true,limit:"16kb"}))

// to store files folder in server
app.use(express.static("public"))// store the images etc 



// crud operarion on cookies

// 🔹 What cookie-parser does
// When a browser sends a request to your server, any cookies for that domain are included in the HTTP 
// header:Cookie: sessionId=abc123; theme=dark
// By default, Express doesn’t automatically parse that into a nice JavaScript object —
//  you’d have to manually read and split the header.

// cookie-parser middleware:Reads the Cookie header from incoming requests. and Parses it into req.cookies 
// so you can access cookies like:

// req.cookies.sessionId  // "abc123"
// req.cookies.theme      // "dark"
// (Optional) If you give it a secret key, it will also verify and decode signed cookies.
app.use(cookieParser())// 








// routes


// not using get as we have seprated the route and controller unlike in requestHandler
// now u can take user to any other more routes  as its a preofessional project
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
export {app}
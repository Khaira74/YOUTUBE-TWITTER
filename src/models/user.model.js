import mongoose,{Schema} from "mongoose";
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})
// 💡 So bcrypt is used only once during login to confirm credentials,
// and JWT is used for every request after login to avoid checking the password again and again.


import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchmea=new Schema(
    {

        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,

        },
        fullname:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            index:true,

        },
        avatar:{
            type:String,//cloudinary url
            required:true

        },
        coverImage:{
            type:String// foe the path
        },
        // an array of history
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
// type: Schema.Types.ObjectId
// The value stored in watchHistory is not plain text or a number — it’s a MongoDB ObjectId.
// This ObjectId is basically a unique identifier for a document in another collection (in this case, users).

// ref: "User"
// This is a reference to another model in Mongoose — the "User" model.
// It tells Mongoose which collection this ObjectId belongs to.
// "User" here must match the name you passed when you created the model:
        ],
        password:{
            type:String,
            required:[true,'Password is required']
        },
        //passing token coz
        // 1. So you can store it in MongoDB for validation
        // 2. So you can revoke it If the refresh token lives only in the client’s browser, you can’t 
        // force logout without telling the client to delete it.
        refreshToken:{
            type:String

        }
    },{timestamps:true}
)

// encryption
// using pre means saving the  data bedore submting 
userSchmea.pre("save",async function (next) {
    // onyl chage if ther is change in passwokrd feild
    if(!this.isModified("password")){
        return next()
    }
    this.password=await bcrypt.hash(this.password,10)// what to encrypt // number of rounds
    next()
    
})

// login
// In your schema file, you’re just defining the function and attaching it to the User model via:
// Not executed yet → It’s just a method definition.
// Every time you fetch a User document from MongoDB, that document will have this method available.
// You call it later (e.g., in the login route) on a specific user instance.
userSchmea.methods.isPasswordCorrect=async function(password){
   return  await bcrypt.compare(password,this.password)
}

// jwt a berarrer token  if the server is geting jwtoken from user it will give data to it 


// THSI fucntion gnereates a JWT    
// After bcrypt confirms the password is correct, you generate a token using jwt.sign().
// You send this token to the client (usually as a cookie or in the response body).
// On future requests, the client sends the token back (in headers or cookies), and you verify it with jwt.verify().
userSchmea.methods.generateAccessToken=function(){// short lived
     return jwt.sign(
        {
            // right side values comingform database
            // left is payload 
            // why not password?-->A JWT payload is Base64 encoded, not encrypted.Anyone with the token can
            //  decode it at jwt.io and see the contents. If you put the password (even hashed) in there:
            //  Attackers could try to crack the hash offline. You’re unnecessarily exposing sensitive data.


            _id:this._id,//_id is the MongoDB document ID for the user — the unique identifier that 
            // MongoDB automatically creates when a document (user record) is stored in a collection.
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,// private key
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY || "15m"// end date of toekn
        }
    )
}
// A JWT has 3 parts:
// HEADER.PAYLOAD.SIGNATURE

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

// eyJ1c2VybmFtZSI6ImFybWFuIiwiZW1haWwiOiJhcm1hbkBleGFtcGxlLmNvbSJ9

// dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

// 1. When you create the token (jwt.sign)
// You:
// Take the header (algorithm, type)
// Take the payload (e.g., _id, email)
// Combine them → header.payload
// Run them through your signing algorithm with ACCESS_TOKEN_SECRET
// Output is the signature


// 2. When you verify the token (jwt.verify)
// Server:
// Splits the JWT into header, payload, signature.
// Uses your secret key to recompute the signature from the header and payload.
// Compares the computed signature to the signature in the token.
// If they match → token is valid and unaltered.
// If they don’t match → token has been tampered with (reject it).



userSchmea.methods.generateRefreshToken=function(){//long ived
     return jwt.sign(// 
        {
            // right side values comingform database
            // left is payload 
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY||"7d"
        }
    )
}
//1 Login

// Verify password with bcrypt.
// Generate:
// accessToken (short expiry, e.g., 15m).
// refreshToken (long expiry, e.g., 7d).
// Send both to client.

// 2Accessing protected route

// Client sends accessToken.
// Server verifies it → if valid, returns data.
// If expired → client sends refreshToken to /refresh endpoint.

//3 Refreshing token

// Server verifies refreshToken (usually checks DB).
// If valid → issues new accessToken (and sometimes new refreshToken).
export const User=mongoose.model("User",userSchmea)
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT=asyncHandler(async(req,res,next)=>{
    // from the user
   try {
     const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")// we removed brearer
     //  and used only token using replace
     // Authorization:Bearer<token> this is sent by the user 
 
     if(!token){
         throw new ApiError(401,"uthorisiation request")
     }
     const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
    // exporting direct user instead of id 
    // verify function gives the object id as output 
     const user=await User.findById(decodedToken?._id).select(
         "-password -refreshToken"
     )
 
     if(!user){
         throw new ApiError(401,"invalid access token")
     }
     req.user=user//used for  creting new object to use in another functions
     next()
   } 
   catch (error) {
    throw new ApiError(401,error?.message || "invalid access token ")

    
   }
})

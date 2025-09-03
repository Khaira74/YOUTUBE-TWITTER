import { asyncHandler} from "../utils/asyncHandler.js"

import {ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessandRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)

        const refreshToken=user.generateRefreshToken()
        const accessToken=user.generateAccessToken()
        user.refreshToken=refreshToken

        await user.save({ValidateBeforeSave:false})
        console.log("jattttlife",refreshToken)
        console.log("jatte",accessToken)


        return {accessToken,refreshToken}

        
    } catch (error) {
        console.log(refreshToken)
        throw new ApiError(500,"something went wrong  while generating")
        
    }
}
const registerUser=asyncHandler(async (req,res)=>{
    // get  user detials from frontend
    //validation - not empty
    //check if user alrady exist:username, email
    //check for image,avatar
    //uploding to cloudinary
    //create user object create enth in db
    // remove password and refresh token feild from response
    // check for usercreation
    //return response

 
    const {fullname,email,username,password}=req.body
    
    console.log("email: ",email)  
    

    if(
        [fullname,email,username,password].some((feild)=>feild?.trim()==="")
    ){
        throw new ApiError(400,"all feilds are required ")

    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]

    })
    if(existedUser){
        throw new ApiError(409,"username already exists")
    }

    // req.file is given by multer  taking image from the middleware in route.js
    //req .files consist of avatar and coverImage and both of them are arrays tahst why we [0]
    const avatarLocalPath=req.files?.avatar[0]?.path

    // if we are only getting avatar as input coz coverImage is optional we do below things

     let coverImageLocalPath

    if (req.files /** if insedi req.files*/ && Array.isArray(req.files.coverImage)/* check if it as array pr not */  && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avtar file required missing local path")
    }



    // uplading pictures on cloudianry database 
    const avatar=await uploadCloudinary(avatarLocalPath)
    const coverImage=await uploadCloudinary(coverImageLocalPath)

console.log("Avatar uploaded:", avatar?.secure_url);
console.log("Cover uploaded:", coverImage?.secure_url);
    if(!avatar){
        throw new ApiError(400,"avtar file required")
    }




    // uploding data on mongodb databse
    // We use a model in a full-stack app to talk to the database because it acts as the bridge between 
    // your code and the actual database.
    const user=await User.create({
        fullname,
        avatar:avatar.url,// response form the cloidinary uplaod function see in utils
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
//     This tells Mongoose: “Insert a new document in the users collection with these fields.” As soon as 
// MongoDB stores the document, it generates a unique _id for it. Mongoose then returns the newly created
//  document (with _id already filled in).


    // selecting them

    // user._id is created when we create in databse
    console.log(user)
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"something went wrong whil registring");
        
    }



    // final resonse
    return res.status(201).json(new  ApiResponse(200,"user registred successsfully"))



 
    // FOR LEARNING PURPOSE
    // return res.status(200).json({
    //     message:"ok jatt life"
    // })

})


const loginUser=asyncHandler(async (req,res)=>{
    // get the data
    // username or id exist or not 
    // use bycrpt method and 
    //  2 jwt creation


    const {username,email,password}=req.body
    

    console.log(email)

    console.log(username)
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    const user=await User.findOne({
        $or:[{username},{email}]

    })


    if(!user){
        throw new ApiError(409,"username already exists")
    }


    const isPassValid= await user.isPasswordCorrect(password)

    if(!isPassValid){
        throw new ApiError(404,"Invalid user credentials")

    }
    console.log(user._id)
    //genernating access token together 
    // Yes ✅ — the _id here is the same user ID you’d use for both the access token and refresh token.
    // The _id in the JWT payload is the same _id field stored in your database document for that user.
    const {accessToken,refreshToken}=await generateAccessandRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")// to update the user 

    const options={
        httpOnly:true,
        secure:true
    }
    console.log(accessToken)

    console.log(refreshToken)
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken// sending here again if user wan to save the okens 
            }
        )
    )


})


const logoutUser=asyncHandler(async(req,res)=>{
    // clear refreshtoken from user  from model
    // clear cookies 


    // _id not accesible here  to find user, as no form while logging out. so we create a middlware named 
    // auth.middlware,js to get _id from the jwt returned  by the user
    //ass we have addaed middlware we can acces its methods like we did with register
    // removinf refreshTokens
    await User.findByIdAndUpdate( 
        req.user._id,
        {
            $unset:{
// That’s a great question  You’re absolutely right that res.clearCookie("refreshToken") removes the
//  cookie from the browser — but that only clears it client-side.The database still has the refreshToken
//  saved for that user.
// Unsetting refreshToken in DB ($unset) Removes the stored refresh token from the user’s record.Means even
//  if someone tries to use the old refresh token, you can reject it because you no longer have it saved.
// This gives you server-side control to invalidate tokens on logout.
                refreshToken:1// updating directly in database// for refence see moldes folder and schmea
            }
        },
        {
            new:true
        }
    )


    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)/// only from client side
    .clearCookie("refreshToken",options)// only from client side
    .json(
        new ApiResponse(200,{},"USER LOGGED OUT ")
    )
    

})

const regenerateRefreshToken=asyncHandler(async(req,res)=>{
    // matching the token signatue send by brower and the saved one in the database


    const incomingRefreshToken=req.cookie.accessToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized reqwuest")
    }

    try {
// When you call jwt.verify(token, secret), JWT does two things in one step:
// 1. Checks the signature
// Makes sure the token was signed using your secret (and hasn’t been tampered with).
// If the signature is invalid or the token expired, it throws an error.

// 2. Decodes the payload
// If the token is valid, it gives you back the payload object you originally signed.
// This is where you can access _id, email, username, etc.
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=                                                                                                                                                                                                                                                                                                                               User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }

        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"refresh token in expired or used")
        }

        
    

    const options={
        httpsOnly:true,
        secure:true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(200, {accessToken, refreshToken: newRefreshToken},"Access token refreshed")
    )
}

    catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
        
    }
})

const changeCurrPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user= User.findById(req.user?._id)// from the middleware

    const isPasscorr=user.isPasswordCorrect(oldPassword)
    if(!isPasscorr){
        throw new ApiError(400,"invalid OLD PASSWORD")

    }
    user.password=newPassword//setting
    user.save({ValidateBeforeSave:false})//saving 
})
const getCurrentUser=asyncHandler(async(req,res)=>{

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})




const updateAccountDetails=asyncHandler(async(req,res)=>{
// In Mongoose, your schema might have fields like:

// const userSchema = new mongoose.Schema({
//   fullname: String,
//   email: String,
//   password: String
// });
// If the names in req.body match your schema field names, you can directly pass them to .create() or .save().
// Example:const user = await User.create({ fullname, email });

// If they don’t match, you’ll need to map them:

// const { name, mail } = req.body;
// await User.create({
//   fullname: name,
//   email: mail
// });
    const {fullname,email}=req.body

    if(!fullname || !email){
        throw new ApiError(400,"all feild are required")
    }
    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }

        }
    ).select("-password -refreshToken")
    return res
    .status(200)
    .json(
        new ApiResponse(200,"account details updated succesfully")
    )
})

const updateUserAvtar=asyncHandler(async(req,res)=>{

    const avtarLocalPath=req.file?.path
    if(!avtarLocalPath){
        throw new ApiError(400,"avtar file missing")
    }

    const avtar=await uploadCloudinary(avtarLocalPath)
    if(!avtar.url){
        throw new ApiError(400,"error while uplaoding")
    }

    const user=findById(user?._id,
        {
            $set:{
                avatar:avtar.url
            }

        },
        {new:true}
    ).select("-password")

})

const updateUserCoverImage=asyncHandler(async(req,res)=>{

    const coverImageLocalPath=req.file?.path// from the user
    if(!coverImageLocalPath){
        throw new ApiError(400,"image file missing")
    }

    const coverImage=await uploadCloudinary(coverImageLocalPath)// uploading on cloud
    if(!coverImage.url){
        throw new ApiError(400,"error while uplaoding")
    }

    const user=findById(user?._id,
        {
            $set:{
                avatar:coverImage.url
            }

        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"cover image updated")
    )

})

// subscription 
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    //Extracting the username from the URL parameters.
// If your route is /api/channel/:username, this gets that value.
     if(!username?.trim){
        throw new ApiError(400,"username is missing")
     }





// Instead of User.findOne({ username }), you’re using MongoDB’s aggregation pipeline to: Match the user.
// Join subscription data. Compute extra fields (counts, subscription status).
// Reason: Aggregation can do all steps in one database query, instead of multiple .find() calls & .populate().


// Why aggregate User when subscriptions are stored separately?
// Even though your Subscription documents are stored in a separate collection, they only hold references 
// (subscriber and channel) to users.
// A Subscription doc doesn’t have: username fullname avatar coverImageThose fields live in the User collection.

// Exactly ✅ — $lookup in MongoDB aggregation doesn’t care which collection you started from.The “main” 
// collection is just where your pipeline starts (User.aggregate() or Subscription.aggregate()).
// After that, $lookup can jump to any other collection you specify in from.
// $lookup is not tied to the collection you aggregate from; it just needs:
// The current document’s field (localField)
// The other collection + field to match (from, foreignField)



// User.aggregate() = "Start with a user"

// $lookup = "Attach extra info from another collection"

// $addFields = "Add calculated stats into the same user"

// $project = "Keep only what’s needed"
    const channel=await User.aggregate([
        {
            $match:{
                // filters documents so only the user with the given username is processed.
                // no relation with _id

                username:username?.toLowerCase()// not nessary to lowercase
            }
        },




        {
            //$lookup in MongoDB aggregation doesn’t care which collection you started from.
// Take a user’s _id from User collection.// loacla feild
// Search Subscription collection for documents where channel equals that _id.// foreinfeild
// Attach those matching subscription docs into the "subscribers" array.// as 
            $lookup:{
                from:"subscriptions",//Subscription converted to subscriptions when in database
                localField:"_id",
// We use _id instead of username mainly because:
// Immutable → _id never changes for a document, but a username can be edited.
// Efficient lookup → _id is indexed by default in MongoDB, so queries and $lookup are faster.
// Guaranteed uniqueness → No chance of duplicates like usernames might have (unless you enforce unique constraint).
// Smaller storage → An ObjectId is 12 bytes, usually smaller than storing strings.
                foreignField:"channel",
                as:"subscribers" // Output array name
                // no of maatching chanel emans that many number of susbscibers
            }

        },
        {
            $lookup:{
                from:"subscriptions",//Subscription converted to subscriptions when in database
                localField:"_id",
                foreignField:"subscriber",// inside susbscriptions
                as:"subscribedTo"
            }

        },
        {// ading in the users model direclty
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"// size of the array of users channels subscribers
                },
                channlesSubscribedToCount:{
                    $size:"$subscribedTo"// size of the array of users channels subscribers
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        // check if req.user?._id, is preset in subscribers array or not 
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channlesSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,

            }

        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )


})


const getUserWatchHistory=asyncHandler(async(req,res)=>{
    const user=User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
                //In MongoDB, when you compare an _id field, the type must match exactly — and in your database,
                //_id is stored as an ObjectId, not a string. req.user._id (coming from JWT or middleware)
                //is usually a string, so MongoDB wouldn’t match it correctly unless youconvert it to ObjectId.

            }
        },
        {
//User document has → watchHistory: [videoId1, videoId2, videoId3...]

// $lookup into videos collection → replaces those IDs with full video documents.

// Inside each video → it has an owner field (the uploader’s userId).

// Another $lookup → fetches the owner’s details (username, avatar, etc.).

// $addFields → flattens the owner from [ { ... }] → { ... }.
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
// In your code, the reason you lookup from owner is because in your videos collection, each video has
//  an owner field that stores the ObjectId of a user (the person who uploaded/owns the video).
// now for each video collection from the watchHistory array we are getting things like owner 
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                     {
//  After lookup, owner is an array (even if it has only one element).

// $addFields modifies each video document.

// Replace owner array with its first element ($first).

// So now each video’s owner is a clean object {fullName, username, avatar} instead of [ {...} ]
                        $addFields:{
                            owner:{
// $first takes the first element of the array ["owner"]\Replaces owner with just that element.
                                $first: "$owner"
                            }
                        }
                    }
                    
                ]
                
            }
        }
    ])
     return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})
export  {
    registerUser,
    loginUser,
    logoutUser,
    regenerateRefreshToken,
    changeCurrPassword,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory,
    getCurrentUser

}
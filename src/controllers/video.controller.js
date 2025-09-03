import { asyncHandler} from "../utils/asyncHandler.js"

import {ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose, { Aggregate } from "mongoose"
import {Comment} from "../models/comment.model.js"

import {Video} from "../models/video.model.js"

// Yes 👍 exactly! You can think of it like opening a YouTube channel page of a user.
// When you open someone’s channel, you only see the videos uploaded by that user — not everyone’s videos.
const getAllVideos = asyncHandler(async (req, res) => {
    // Those parameters (page, limit, query, sortBy, sortType, userId) are frontend → backend communication 
    // tools. They exist so the frontend can control what data it wants to show, instead of the backend
    //  dumping everything at once.
    const { page = 1, limit = 10, query, sortBy="CreatedAt", sortType="desc", userId } = req.query
    
// here userID is not we can get from params its the req.query one means it may be or maynot be used for query
// req.query (Query string parameters) Part of the URL after ?.Used for optional filters, sorting, 
// pagination, search, etc. and id Not mandatory.

    if(!req.user){
        throw new ApiError(401,"user need to be logged in")

    }

// $regex is a MongoDB operator that lets you search strings by pattern (like “find titles containing this word”).
// But with $regex:
// { title: { $regex: "music", $options: "i" } }
// 👉 It matches any title containing the word "music", such as:
// "Music Video"
// "Punjabi Music Vlog"
// "Top 10 Music Hits"
// The $options: "i" makes it case-insensitive:
// "Music" = "music" = "MUSIC"
const match={
    // title from video model
    // owner from vidoe model
    ...(query?{title:{$regex:query,$options:"i"}}:{}),//checks if query is given ornnot 
    ...(userId?{owner:new mongoose.Types.ObjectId(userId)}:{})// checks if _id is given or not
    // if both not goven means we ahve to print all videos from cloud 
}

    const videos=Video.aggregate([
        {
            $match:match
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"videoByOwner"
            }
        },
        {
            $project:{
                videoFile: 1, // Video file link
                thumbnail: 1, // Thumbnail image link
                 title: 1, // Video title
                 description: 1, // Video description
                 duration: 1, // Video duration
                 views: 1, // Number of views
                isPublished: 1, // Whether the video is published or not
                owner: {
                 $arrayElemAt: ["$videosByOwner", 0], // Extracts the first user object from the array
                }
            }
        },
        {
            $sort:{
                [sortBy]:sortType==="asc"?1:-1
            },
            
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
        {
            
        }
    ])
    // videos should match the name we used to aggrigate
    if(!videos?.length){
        throw new ApiError(404,"videos not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,videos,"viedos fetched succesfuly"))
    

    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!req.user){
        throw new ApiError()
    }

    if(
        [title,description].some((feild)=>feild?.trim()==="")
    ){
        throw new ApiError(400,"all feilds are required ")

    }
    const videoFilepath=req.files?.videoFile[0].path
    const thumbNailpath=req.files?.thumbnail[0].path

    if(!videoFilepath){
        throw new ApiError(400,"video file missing")
    }
    if(!thumbNailpath){
        throw new ApiError(400,"thumbnail file missing")
    }


    const video= await uploadCloudinary(videoFilepath,{resource_type:"video"})
    const thumbnail= await uploadCloudinary(thumbNailpath)
    const duration =  video.duration

    if(!video){
        throw new ApiError(400,"Cloudinary Error: Video file is required")
    }
    if(!thumbnail){
        throw new ApiError(400,"Cloudinary Error: thumbnail file is required")
    }

    const videoss=await Video.create({
      videoFile: video.url, // Cloudinary URL of the video file
      thumbnail: thumbnail.url, // Cloudinary URL of the thumbnail
      title,
      description,
      owner: req.user?._id, // ID of the user who uploaded the video
      duration, // Duration of the video (in seconds)

    })

    if(!videoss){
        throw new ApiError(500, "Something went wrong while publishing a video")

    }
    return res
    .status(201)
    .json(new ApiResponse(201,{videoss},"Video published Successfully"))


    
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {


    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400,"no video presnet")
    }
    const vidoe=Video.findById(videoId).populate("owner")
    console.log(vidoe)

    if(!vidoe){
        throw new ApiError(500,"ssomething went wrong while getting video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{vidoe},"video fetched sucesfulty"))

    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"no video presnet")
    }
    const {title,description}=req.body

    if([title,description].some(feild=> feild?.trim()==="")){
        throw new ApiError(400,"all feilds are required ")
    }

    const thumbNailpath=req.files?.thumbnail[0].path
    if(!thumbNailpath){
        throw new ApiError(400,"thumbnail file missing")
    }

    // cheking if woner or not 
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this video");
    }
    const thumbnail= await uploadCloudinary(thumbNailpath)
     if(!thumbnail?.url){
        throw new ApiError(400,"Cloudinary Error: thumbnail file is required")
    }

    const videoo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail:thumbnail.url
            }
        },
        {new:true}
    )
    if(!videoo){
       throw new ApiError(404, "Video not found")

    }
     return res
    .status(200)
    .json(new ApiResponse(200, videoo, "Video updated successfully"));
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400,":invalid videoId id")
    }

    const videoo=Video.findByIdAndDelete(videoId)


    // to delete from cloudinary
// const videoFile = findCloudinaryPublicId(videoo.videoFile);
//     const thumbnail = findCloudinaryPublicId(videoo.thumbnail);

//     try {
//         var deleteVideo = await deleteOnCloudinary(videoFile, 'video');
//         var deleteThumbnail = await deleteOnCloudinary(thumbnail, 'image');
//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while deleting data on cloudinary");
//     }

    return res.status(200).json(new ApiResponse(200,videoo,"video deleted succedfuly but not from cloudinary"))
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params


    if(!videoId){
        throw new ApiError(404,":invalid videoId id")
    }

    const videoo=await Video.findById(videoId)
    if (!videoo) {
       throw new ApiError(404, "Video not found");
    }

    videoo.isPublished=!videoo.isPublished
//     await video.save({ validateBeforeSave: false })
//     When you do:
// await video.save({ validateBeforeSave: false });
// you are telling Mongoose:
// 👉 “Save this document without running schema validations.”
    return res
    .status(200)
    .json(
      new ApiResponse(200, videoo, "Video publish status toggled successfully")
    );





})




export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
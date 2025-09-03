

import { asyncHandler} from "../utils/asyncHandler.js"

import {ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose, { Aggregate } from "mongoose"

import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
  // Function to get comments for a specific video

  /*
    Step 1: Extract videoId from request parameters
    - req.params contains route parameters like videoId (e.g., /video/:videoId/comments)
  */
  const { videoId } = req.params;

  /*
    Step 2: Extract pagination details from query parameters
    - If the client sends ?page=2&limit=5, then:
      - page = 2 (fetch second page of comments)
      - limit = 5 (fetch 5 comments per page)
    - If no values are provided, default to page 1 and limit 10
  */
  const { page = 1, limit = 10 } = req.query;

  /*
    Step 3: Validate videoId
    - MongoDB uses ObjectId format, so we need to check if videoId is a valid ObjectId.
    - If the ID is invalid, we throw an error.
  */
  if (videoId) {
    throw new ApiError(400, "Invalid video ID");
  }

  console.log("Video ID:", videoId, "Type:", typeof videoId); // Debugging log

  /*
    Step 4: Convert videoId to ObjectId
    - MongoDB stores IDs as ObjectId, so we need to convert videoId (string) to ObjectId format.
    - This ensures correct matching in the database.
  */
  const videoObjectId = new mongoose.Types.ObjectId(videoId);


  /*
    Step 5: Fetch comments using aggregation

  */
  const comments = await Comment.aggregate([
    {
      /*
        Step 5.1: Match comments related to the specified video ID
        - This filters out only comments that belong to the requested video.
      */
      $match: {
        video: videoObjectId,
      },
    },
    {
      /*
        Step 5.2: Lookup video details
        - Joins the "videos" collection to get details about the video which has the comment
        - The result is stored as "CommentOnWhichVideo".
      */
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "CommentOnWhichVideo",
      },
    },
    {
      /*
        Step 5.3: Lookup user details (comment owner)
        - Joins the "users" collection to get details about the user who posted the comment.
        - The result is stored as "OwnerOfComment".
      */
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "OwnerOfComment",
      },
    },

    {
      /*
        Step 5.4: Restructure the output
        - $project is used to include only required fields.
        - $arrayElemAt extracts the first (and only) element from "OwnerOfComment" and "CommentOnWhichVideo".
        - This avoids unnecessary array nesting in the result.
      */
      $project: {
        content: 1, // Include the comment content
        owner: {
          $arrayElemAt: ["$OwnerOfComment", 0], // Extract first element from owner array
        },
        video: {
          $arrayElemAt: ["$CommentOnWhichVideo", 0], // Extract first element from video array
        },
        createdAt: 1, // Include timestamp
      },
    },

    {
   
      $skip: (page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
    
  ]);
  console.log(comments); // Debugging log to check fetched comments
  if (!comments?.length) {
    throw new ApiError(404, "Comments are not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));

});
const addComment = asyncHandler(async (req, res) => {
  // check if exist or not 

    const{videoId}=req.params

    const {content}=req.body
    if (!videoId || !content) throw new ApiError(404, "Id or content not found");
    const comment=await Comment.create(
      {
        content,
        owner:req.user,
        video:videoId
      }
    )
        if (!comment) throw new ApiError(504, "not created");

        return res.status(200).json(new ApiResponse(200,{comment},"comment has been added"))

})


const updateComment = asyncHandler(async (req, res) => {


  const CommentId=req.params
  const {content}=req.body

  if(!CommentId){
    throw new ApiError(400, "Invalid comment ID");
  }
  if (!req.user) {
    throw new ApiError(401, "User must be logged in");
  }
  if (!content) {
    throw new ApiError(400, "Comment cannot be empty");
  }
  const comment=Comment.findByIdAndUpdate(
    {
      _id:CommentId,
      owner:req.user._id
    },
    {
      $set:{
        content,
      }
    },{new:true}
  //This tells Mongoose:
// ➡️ "After the update, return the updated document instead of the old one."
  )
  if(!comment){
    throw new ApiError()
  }
    return  res.status(200).json(new ApiResponse(200, comment, "comment update successfully"));

    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {

    const CommentId=req.params
    if(!CommentId){
    throw new ApiError(400, "Invalid comment ID");
  }
  if (!req.user) {
    throw new ApiError(401, "User must be logged in");
  }

    const comment=Comment.findByIdAndDelete({
      _id:CommentId,
      owner:req.user._id
    })
    if (!comment) {
    throw new ApiError(500, "Something went wrong while deleting the comment");
  }

  /*
    Successfully deleted the comment, return a response
    - Send back the deleted comment data as a confirmation
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, comment, "Comment deleted successfully")
    );


   

    // TODO: delete a comment
})
export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}
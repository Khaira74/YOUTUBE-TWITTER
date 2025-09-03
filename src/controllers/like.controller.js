import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { json } from "express"

const toggleVideoLike = asyncHandler(async (req, res) => {

    const userId=user.id._id
    const {videoId} = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    // findin the like document 

    const like=Like.findOne(
        {
            likedBy:userId,
            video:videoId
        }

    )
    // if already liked 
    if(like){
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(new ApiResponse(200,{like},"like deleted "))

    }
    else{
        const newlike=Like.create({
        video:videoId,
        likedBy:userId
    })
      return res.status( 200 )
        .json( new ApiResponse( 200, like, "Like added" ) )

    }
    
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    const userId=req.user._id
    if(isValidObjectId(commentId)){
        throw new ApiError(400,"invalid error")
    }
    const like=Like.findOne(
        {
            likedBy:userId,
            comment:commentId

        }
    )
    if(like){
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(new ApiResponse(200,{like},"like deleted "))

    }
    else{
        const newlike=Like.create({
            comment:commentId,
            likedBy:userId
        })
      return res.status( 200 )
        .json( new ApiResponse( 200, like, "Like added" ) )

    }
    
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {


    //TODO: toggle like on tweet
    // 1. get tweetId from params URL
    const { tweetId } = req.params

    if ( !isValidObjectId( tweetId ) ) { throw new Apierror( 400, "Invalid tweet" ) }

    // 2. check if the user has already liked the tweet
    const tweetLike = await Like.findOne( {
        $and: [ { likedBy: req.user?._id }, { tweet: tweetId } ]
    } )

    // 3. if already liked then delete the like
    if ( tweetLike )
    {
        const unLike = await Like.findByIdAndDelete( tweetLike._id )

        return res.status( 200 )
            .json( new ApiResponse( 200, unLike, "Like removed" ) )
    }

    // 4. if not liked then add the like
    const Liked = await Like.create( {
        likedBy: req.user?._id,
        tweet: tweetId
    } )

    return res.status( 200 )
        .json( new ApiResponse( 200, Liked, "Like added" ) )
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    

    const userId=req.user._id

    const like=Like.find({
        likedBy:userId,
        video:{$exists:true}

    }).populate("video","title thumbnail videoFile duration owner")
    //Without populate → only ObjectIds, frontend needs more queries.
// With populate → full details in one query, frontend is faster & simpler.
// You only get video: ObjectId.

// So, to show details, you’d need extra queries for each video:
// const likes = await Like.find({ likedBy: userId }); // step 1 → only ObjectIds
// // step 2 → fetch videos manually
// const videoIds = likes.map(like => like.video);
// const videos = await Video.find({ _id: { $in: videoIds } }); 


    return req.status(200).json(new ApiResponse(200,{
        count: like.length,
        videos: like.map(likes => likes.video), // extract only video objects
      },
      "Liked videos fetched successfully","videos are hrer"))




    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
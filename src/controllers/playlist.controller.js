import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {


    const {name, description} = req.body

    if([name,description].some(feilds=>feilds.trim()==="")){
        throw new ApiError(400, "name or description is required")
    }

    const playlist=await Playlist.create(
        {
            name:name,
            description:description,
            owner:req.user._id
        }
    )
    if(!playlist){
        throw new ApiError(500,"playlist cretion failed")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist creatad succesfuly"))

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {


    const {userId} = req.params
    if(!userId){
        throw new ApiError()
    }
// 🔹 So do we need userId param?
// Case 1: Personal (only logged-in user’s playlists)
// ✅ No need for userId. Just use req.user._id from JWT.

// Case 2: Public (view any user’s playlists)
// ✅ You do need userId in params. JWT only tells you who is logged in, but you may still want to
//  fetch playlists of another user (like visiting someone’s channel on YouTube).
    const playlist=await Playlist.find({owner:userId})//If a user can have many playlists, you should use .find(), not .findById():
// playlists will be an array of documents.
// If user has 3 playlists, you’ll get an array with 3 objects.
// If user has none, you’ll get [] (empty array).
    if(!playlist){
        throw new ApiError(500,"playlist not ofund")
    }
    return res.status(200).json(new ApiResponse(200,{playlist},"this is suer playlist"))
    //TODO: get user playlists
})




const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400,"playlsit not found")
    }
    const playlist=Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(500,"playlist no found")
    }
    return res.status(200).json(new ApiResponse(200,{playlist},"fouded succesfully"))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
   }


    const playlist=await Playlist.findById(playlistId)
    if ( !playlist.owner.equals( req.user?._id ) ) { throw new ApiError( 400, "You cant update this playlist!" ) }

    if(playlist.videos.includes(videoId)){
        return res.status(200).json(new ApiResponse(200,{playlist},"video already there"))
    }
    playlist.videos.push(videoId)
//  playlist.videos.includes(videoId) →
// This is plain JavaScript. includes() is a built-in JavaScript array method that checks if an array contains a value.

// playlist.videos.push(videoId) →
// Another built-in JavaScript array method, used to append a new item.

// await playlist.save() →
// This is JavaScript using Mongoose (a MongoDB ODM). save() is a method provided by Mongoose documents
   const addedVideo=await playlist.save()
    if ( !addedVideo ) { throw new ApiError( 500, "Video is not added in the playlist please try again!" ) }
    return res.status( 200 )
        .json( new ApiResponse( 200, addedVideo, "Video added in the playlist!" ) )

})


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
   }
    const playlist=await Playlist.findByIdAndUpdate(playlistId
        ,{
            $pull:{videos:videoId}
        },
        {new:true}
    )

    return res.status(200).json(new ApiResponse(200,{playlist},"video delted successfuly"))
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {

     const { playlistId } = req.params

    const playlist = await Playlist.findById(playlistId);

    // Check if the playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the user is the owner of the playlist
    if (playlist.owner !== req.user) {
        throw new ApiError(403, "You are not allowed to remove videos from this playlist");
    }

    await playlist.remove();

    res.status(200).json(new ApiResponse(200, playlist, "playlist removed from database"));


    
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"no playlsit")
    }
    if(playlist.owner.toString()!==req.user._id){
        throw new ApiError(403,"only owner can update")

    }
    if(name){
        playlist.name=name
    }
    if(description){
        playlist.description=description
    }
   
    await playlist.save()
    return res.status(200).json(new ApiResponse(200,{playlist},"playlist updated"))
    
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
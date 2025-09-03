import mongoose, { Schema } from "mongoose";



const playlistSchmea=mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },

        description:{
            type:String,
            required:true
        },
        videos:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],

        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }

    },{timestamps:true}
)
export const Playlist=mongoose.model("Playlist",playlistSchmea)
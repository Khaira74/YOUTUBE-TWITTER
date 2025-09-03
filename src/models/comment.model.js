import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema=new Schema(
    {

        content:{
            type:String,
            required:true
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"

        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }

    },{timestamps:true}
)

// Pagination means breaking large data into smaller chunks (pages) instead of returning everything at once.
// Imagine you have 10,000 comments in your database.If you send all 10,000 in one API call:
// It will be very slow & It will consume huge memory & bandwidth

// Instead, you return them in parts:
// Page 1 → 10 comment
// Page 2 → next 10 comments
// Page 3 → next 10 comments
// ...and so on.
// Think of Google search results.
// When you search something, Google doesn’t show all millions of results at once.
// It shows Page 1 (first 10 results), then Page 2, etc.
// That’s pagination.
commentSchema.plugin(mongooseAggregatePaginate)
export const Comment=mongoose.model("Comment",commentSchema)
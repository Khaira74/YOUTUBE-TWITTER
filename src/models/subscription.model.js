import mongoose, { Schema } from "mongoose";



// both channel and subscriber are the users 
// one time one is subsriber and at at same time one is the channel

//eg you are the channel and other are the subsribers 
// documents re created as below
// a subscribed u channel
// b subsribed u channel
// c subsribed u channel
// we will make joins with  id as of the user (u)and then then get documents where channel is the having the
//  same id  and then form taht document we will get the subsribers
//                      or
// "We query by channel field using the channel's _id (e.g., u), get all subscription documents for
//  that channel, and then populate the subscriber field to get the list of subscribers."
// "We query by channel field using the channel's _id (e.g., u), get all subscription documents for
//  that channel, and then populate the subscriber field to get the list of our subscriptions."

// the joins add an array in the document of the foreign field 





const subscitpionSchema=mongoose.Schema(
    {
        subscriber:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }

    },{timestamps:true}
)

export const Subscription = mongoose.model("Subscription", subscitpionSchema);

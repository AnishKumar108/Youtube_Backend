import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({

    users:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }


},{timestamps:true})

export const subscription = mongoose.model("subscription",subscriptionSchema)
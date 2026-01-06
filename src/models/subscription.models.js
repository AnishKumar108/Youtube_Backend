import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({

    Subscriber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    Channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }


},{timestamps:true})

export const subscription = mongoose.model("subscription",subscriptionSchema)
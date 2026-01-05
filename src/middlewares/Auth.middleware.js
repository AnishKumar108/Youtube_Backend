import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import User  from "../models/users.models.js"
import ApiError from "../utils/ApiError";

const verifyJWT = asyncHandler(async(req,_,next) => {
    try{
        const Token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!Token){
            throw new ApiError(401,"Unauthorised Request")
        }
       const decodedToken =  await jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET)
       if(!decodedToken){
        throw new ApiError(401,"Invalid access Token")
       }

       const user = await User.findById(decodedToken._id).select("-password -refreshToken");

       req.user = user ;
       next();





    }
    catch(error){
        throw new ApiError(401,error?.message || "Invalid access Token")

    }
})

export default verifyJWT;
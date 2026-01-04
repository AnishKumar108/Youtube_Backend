import {asyncHandler} from "../utils/asyncHandler.js";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"
import uploadFile from "../utils/cloudinary.js";

const registerUser = asyncHandler(async(req,res) => {

   const{username,email,fullName,password} = req.body
   
   if([username,email,fullName,password].some((field) => field?.trim() === "")){
         throw new ApiError(400,"All fields are required")
   }

   const existedUser = await User.findOne({$or:[{username},{email}]})
   if(existedUser){
        throw new ApiError(409,"Username or email already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
//    const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverImageLocalPath
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
     coverImageLocalPath = req.files.coverImage[0].path
   }

   if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
   }

   const avatar = await uploadFile(avatarLocalPath)
   const coverImage = await uploadFile(coverImageLocalPath)

   if(!avatar){
        throw new ApiError(500,"Failed to upload avatar")
   }
   
    const response = await User.create({username,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        fullName,
        password
     })

    const finalUser = await User.findById(response._id).select("-password -refreshToken")

    if(!finalUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }

    res.status(201).json(new ApiResponse(200,finalUser,"User registered successfully"))

    

     
   
    
})
// const registerUser = (req, res) => {
//     res.status(200).json({ message: "User registered successfully" });
// }

export default registerUser
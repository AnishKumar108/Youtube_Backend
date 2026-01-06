import {asyncHandler} from "../utils/asyncHandler.js";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"
import uploadFile from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const generateAccessandRefreshToken = async(userId) => {  
    try{
     const user = await User.findById(userId)
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
     user.refreshToken = refreshToken
     await user.save({validateBeforeSave:false})

     return {accessToken,refreshToken}
    }  
    catch(error){
     throw new ApiError(500,"Something went wrong while generating access or refresh tokens")
    }



}

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

const loginUser = asyncHandler(async (req,res) => {
    const {username,email,password}  = req.body

    if(!(username || email)){
     throw new ApiError(400,"Username or email is required")
    }

    const user = await User.findOne({$or:[{username},{email}]})
    if(!user){
     throw new ApiError(403,"Invalid username or email")
    }
    const validUser =  user.comparePassword(password)
    if(!validUser){
     throw new ApiError(403,"Invalid password")
    }

    const{accessToken,refreshToken} = await generateAccessandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

     const options = {
          httpOnly:true,
          secure:true
     }

     res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(new ApiResponse(201,{user:loggedInUser,accessToken,refreshToken},"User LoggedIn Succesfully"))




})

const logoutUser = asyncHandler(async(req,res) => {
     const user = req.user
     await User.findByIdAndUpdate(user._id,{
          $set:{
               refreshToken:undefined
          }
     },{
          new:true
     })

     const options = {
          httpOnly:true,
          secure:true
     }

     res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200,{},"User logged out Succesfully"))

})

const refreshAccessToken = asyncHandler(async(req,res) => {
     const refreshTokenExtracted =  req.cookies?.refreshToken || req.body?.refreshToken

     if(!refreshTokenExtracted){
          throw new ApiError(401,"Invalid refresh Token")
     }

    const decodedRefreshToken =  jwt.verify(refreshTokenExtracted,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedRefreshToken._id)
    if(!user){
          throw new ApiError(401,"User doesn't exist")
    }

    if(user.refreshToken !== refreshTokenExtracted){
     throw new ApiError(401,"Refresh token expired")
    } 

    const options = {
     httpOnly:true,
     secure :true
    }

    const{accessToken,newRefreshToken} = await generateAccessandRefreshToken(user._id);

    res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token refreshed"))


})

const changeCurrentPassword = asyncHandler(async (req,res) => {
     const {currentPassword,newPassword} = req.body
     if(!(currentPassword || newPassword)){
          throw new ApiError(401,"CurrentPassword and newPassword is required")
     }

    const user = await User.findById(req.user._id)

    if(!user){
     throw new ApiError(401,"User doesn't exist")
    }

    const response =  await user.comparePassword(currentPassword);
    if(!response){
     throw new ApiError(401,"Current password is incorrect!")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(201,{},"Password changed Successfully"))


})


const getCurrentUser = asyncHandler(async(req,res) => {
     return res.status(200).json(req.user)
})

const updateAccountDetails = asyncHandler(async(req,res) => {
     const {fullName,email}= req.body

     const updatedUser = await User.findByIdAndUpdate(req.user._id,{$set:{fullName,email}},{new:true}).select("-password");

     return res.status(200).json(new ApiResponse(200,updatedUser,"Account updated succesfully"))

})

const updateUserAvatar = asyncHandler(async (req,res) => {
    const avatarLocalPath =  req.file?.path;
    if(!avatarLocalPath){
     throw new ApiError(401,"Avatar file is required")
    }
    const updatedAvatar = await uploadFile(avatarLocalPath)
    if(!updatedAvatar.url){
     throw new ApiError(401,"Error while uploading the file")
    }

    const response = await User.findByIdAndUpdate(req.user._id,{$set:{avatar:updatedAvatar.url}},{new:true}).select("-password");

    return res.status(200).json(new ApiResponse(200,{},"Updated user Avatar succesfully"))

})

const updateUserCoverImage = asyncHandler(async(req,res) => {
     const coverImageLocalPath = req.file?.path
     if(!coverImageLocalPath){
          throw new ApiError(401,"Coverimage file is required")
     }
     const updatedCoverImage = await uploadFile(coverImageLocalPath)
     if(!updatedCoverImage.url){
          throw new ApiError(401,"Error while uploadig the file")
     }

     const response = await User.findByIdAndUpdate(req.user._id,{$set:{coverImage:response.url}},{new:true}).select("-password");

     res.status(200).json(new ApiResponse(200,{},"updated user CoverImage successfully"))





})


export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}

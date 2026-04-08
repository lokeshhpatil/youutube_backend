import { asyncHandler } from "../utils/asyncHandler.js";
import apiError  from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async(req, res) => {
    const {username, email, fullname, password} = req.body;
    
    // const user = {
    //   username,
    //   email,
    //   fullname
    // }

    res.status(200).json({
        message:"user validation successfull"
    });

    const existingUser = User.findOne({
      $or: [{ email }, { username }]
    })

      if(existingUser){
        throw new apiError(409, "User with this email or username already exist.");
      }

      const avatarLocalPath = req.files?.avatar[0]?.path;
      const coverImageLocalPath = req.files?.coverImage[0]?.path;

      const avatar = await uploadOnCloudinary(avatarLocalPath);
      const coverImage = await uploadOnCloudinary(coverImageLocalPath);

      if(!avatar){
        throw new apiError(400, "Avatar is required.");
      }

      const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: avatar?.url || "",
      })
      
      console.log("user created: ",user);
      
      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      )
      if(!createdUser){
        throw new apiError(500, "server error, user not created.");
      }

      return res.status(201).json(
        new apiResponse(200, createdUser, "User created successfully.")
      )
});

const loginUser = asyncHandler(async(req, res) => {
    res.status(200).json({
        message:"ok"
    })
})

export {registerUser, loginUser}

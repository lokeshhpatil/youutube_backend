import { asyncHandler } from '../utils/asyncHandler.js';
// import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { array } from 'zod';
import ApiError from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating access and refresh token.');
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, 'User with this email or username already exists.');
  }

  // Get local paths for files
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // Upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, 'Avatar is required.');
  }

  // Create user
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  });

  console.log('user created: ', user);

  // Fetch created user without sensitive fields
  const createdUser = await User.findById(user._id).select('-password -refreshToken');
  if (!createdUser) {
    throw new ApiError(500, 'Server error, user not created.');
  }

  return res.status(201).json(new apiResponse(200, createdUser, 'User created successfully.'));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  //check username || email
  if (!email && !username) {
    throw new ApiError(400, 'email or username is required.');
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select('+password');
  console.log('user found', user);

  if (!user) {
    throw new ApiError(404, 'username or email not found.');
  }

  console.log('Entered Password:', password);
  console.log('Stored Password:', user.password);

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid Credentials.');
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, option)
    .cookie('refreshToken', refreshToken, option)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        {
          message: 'user loggenIN successfully.',
        }
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('refreshToken', option)
    .clearCookie('accessToken', option)
    .json(new apiResponse(200, {}, 'user logged out.'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  console.log('reading incoming refresh token', incomingRefreshToken);
  console.log(req.cookies);
  console.log(req.body);
  if (!incomingRefreshToken) {
    throw new ApiError(400, 'unauthorized access');
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    console.log('Decoded token : ', decodedToken);

    if (!decodedToken) {
      throw new ApiError(400, 'Invalid Token.');
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, 'Invalid User.');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh Token Is Expired or Used.');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, NewRefreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', NewRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: NewRefreshToken },
          'access token refreshed successfully.'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Error at try Catch ');
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(400, 'user not found with id: ', req.user?._id);
  }
  console.log('Information retrived from the user: ', user);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, 'Invalid Old Password.');
  }

  user.password = newPassword;
  await save.user({ validateBeforeSave: false });

  return res.status(200).json(new apiResponse(200, {}, 'New Password set successfully!'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log('Current user fetched: ', user);

  return res.status(200).json(new apiResponse(200, user, 'user retrived!'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(401, 'Email or Full Name is Required.');
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email,
      },
    },
    { new: true }
  ).select('-password');

  return res.status(200).json(new apiResponse(200, user, 'User Updated Successfully.'));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, 'Avtar not found on the local storage (empty)');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, 'avatar not uploaded on cloudinary');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true }
  ).select('-password');

  return res.status(200).json(new apiResponse(200, user, 'Avatar Changed.'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, 'Cover Image file not found on the local storage (empty)');
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(400, 'Cover Image is not uploaded on cloudinary');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    { new: true }
  ).select('-password');

  return res.status(200).json(new apiResponse(200, user, 'coverImage Changed.'));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const username = req.params;
  if (!username?.trime()) {
    throw new ApiError(400, 'Username not found.');
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        channelSubscribedTo: {
          $size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        isSubscribed: 1,
        channelSubscribedTo: 1,
        subscribersCount: 1,
        coverImage: 1,
        avatar: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(401, 'channel does not exist.');
  }
  //if exist
  console.log('Retrieved Channel from MongoDB aggregate Method: ', channel);

  return res
    .status(200)
    .json(new apiResponse(200, channel[0], 'User channel retrived successfully.'));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: 'Video',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'WatchHistory',

        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',

              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    email: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
        ],
      },
    },
  ]);

  console.log('Retrived data from watched history.');

  return res
    .status(200)
    .json(new apiResponse(200, user[0].watchHistory, 'History retrived successfully.'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserProfile,
  getWatchHistory,
};

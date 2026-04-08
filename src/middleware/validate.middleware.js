// import ApiError from "../utils/apiError";
import apiError  from "../utils/apiError.js"

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if(!result.success){
    return res.status(400).json({
      message: "validation failed",
      errors: result.error.errors
    });
  }
  req.body = result.data;
  next();
} 

export const validateFile = (req, res, next) => {
  const avatar = req.files?.avatar;

  if(!avatar){
    throw new ApiError(400,"Avatar file is required.");
  }

  const allowedType = ["image/jpg","image/png","image/jpeg"];
  if(!allowedType.includes(avatar.mimetype)){
    throw new ApiError(400,"Invalid file type.");
  }

  const maxSize = 2 * 1024 * 1024;
  if(avatar.size > maxSize){
    throw new ApiError(400,"File size should be less than 2MB.");
  }

  next();
}
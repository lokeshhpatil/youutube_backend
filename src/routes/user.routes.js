import { Router } from 'express';
import {
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
} from '../controllers/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validation/user.validation.js';
import { validateFile } from '../middleware/validate.middleware.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

// router.route("/register").post(registerUser);
// router.route("/login").post(loginUser);

router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  validate(registerSchema),
  validateFile,
  registerUser
);

router.post('/login', validate(loginSchema), loginUser);

//secured routes
router.post('/logout', verifyJWT, logoutUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/change-password', verifyJWT, changeCurrentPassword);
router.patch('/update-account', verifyJWT, updateAccountDetails);
router.patch('/update-avatar', verifyJWT, upload.single('avatar'), updateUserAvatar);
router.patch('/update-cover', verifyJWT, upload.single('coverImage'), updateUserCoverImage);
router.get('/getCurrent-user', verifyJWT, getCurrentUser);
router.get('/c/:getUser', verifyJWT, getUserProfile);
router.get('/getWatch-history', verifyJWT, getWatchHistory);

export default router;

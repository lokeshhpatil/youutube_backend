import {Router} from 'express'
import { registerUser, loginUser, logoutUser } from '../controllers/user.controller.js';
import {upload} from "../middleware/multer.middleware.js"
import { validate } from '../middleware/validate.middleware.js';
import {registerSchema, loginSchema} from '../validation/user.validation.js';
import {validateFile} from "../middleware/validate.middleware.js"
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

// router.route("/register").post(registerUser);
// router.route("/login").post(loginUser);

router.post("/register",
    upload.fields([
        { name:"avatar", maxCount:1 },
        { name:"coverImage",maxCount:1 }
    ]),
    validate(registerSchema),
    validateFile,
    registerUser);


router.post("/login",
  validate(loginSchema),
  loginUser);

router.post("/logout",
  verifyJWT,
  logoutUser
);

export default router;
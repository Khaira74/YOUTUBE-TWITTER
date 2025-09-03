import { Router } from "express";

import { changeCurrPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory, loginUser, logoutUser, regenerateRefreshToken, registerUser, updateAccountDetails, updateUserAvtar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";

const router=Router()


// adding middlware inside the route 
router.route("/register").post(
    // MULTER IS ALWAYS ADDED IN ROUTES AS IT IS A MIDLEWARE
    upload.fields([
        {
            name:"avatar",// name should be same of  feild in react too  and in user model 
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]),registerUser
)


router.route("/login").post(loginUser)

// secured routes 
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(regenerateRefreshToken)
router.route("/change-password").post(verifyJWT,changeCurrPassword)


router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvtar)
router.route("/cover-image").patch(verifyJWT,  upload.single("coverImage"),updateUserCoverImage)
router.route("/history").get(verifyJWT, getUserWatchHistory)






export default router
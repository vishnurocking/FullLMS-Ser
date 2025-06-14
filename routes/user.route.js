// C:\Users\Lenovo\Development\Project\02FullLMS\server\routes\user.route.js

import express from "express";
import {
  getUserProfile,
  login,
  logout,
  register,
  updateProfile,
  googleLogin,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// New route for Google Sign-In
router.route("/google-login").post(googleLogin);

// Dormant routes for email/password
router.route("/register").post(register);
router.route("/login").post(login);
 
router.route("/logout").get(logout);
router.route("/profile").get(isAuthenticated, getUserProfile);

// Modified route: No longer uses multer for file uploads
router.route("/profile/update").put(isAuthenticated, updateProfile);

export default router;

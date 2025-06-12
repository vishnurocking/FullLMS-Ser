// C:\Users\Lenovo\Development\Project\02FullLMS\server\routes\purchaseCourse.route.js

import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { 
    createRazorpayOrder, 
    verifyPayment, 
    getAllPurchasedCourse, 
    getCourseDetailWithPurchaseStatus 
} from "../controllers/coursePurchase.controller.js";

const router = express.Router();

// router.route("/checkout/create-checkout-session").post(isAuthenticated, createCheckoutSession);
// router.route("/webhook").post(express.raw({type:"application/json"}), stripeWebhook);

// New Razorpay routes
router.route("/create-order").post(isAuthenticated, createRazorpayOrder);
router.route("/verify-payment").post(isAuthenticated, verifyPayment);

router.route("/course/:courseId/detail-with-status").get(isAuthenticated,getCourseDetailWithPurchaseStatus);

router.route("/").get(isAuthenticated,getAllPurchasedCourse);

export default router;
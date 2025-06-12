// C:\Users\Lenovo\Development\Project\02FullLMS\server\controllers\coursePurchase.controller.js

import Razorpay from "razorpay";
import crypto from "crypto";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// 1. Create Razorpay Order
export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    const options = {
      amount: course.coursePrice * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: "Error creating Razorpay order" });
    }

    // Create a new course purchase record with 'pending' status
    const newPurchase = await CoursePurchase.create({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending",
      paymentId: order.id, // Use paymentId to store Razorpay order_id initially
    });

    return res.status(200).json({
      success: true,
      order,
      purchaseId: newPurchase._id, // Send the DB purchase ID to the client
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2. Verify Payment and Grant Access
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      purchaseId, // The ID of our CoursePurchase document
    } = req.body;

    // Find the pending purchase
    const purchase = await CoursePurchase.findById(purchaseId).populate("courseId");
    if (!purchase) {
      return res.status(404).json({ message: "Purchase record not found." });
    }

    // Verify the signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is authentic, update the database
      purchase.status = "completed";
      // Optionally update paymentId to the actual payment_id
      purchase.paymentId = razorpay_payment_id; 
      await purchase.save();

      // Grant access to the course
      // Update user's enrolledCourses
      await User.findByIdAndUpdate(
        purchase.userId,
        { $addToSet: { enrolledCourses: purchase.courseId._id } },
        { new: true }
      );

      // Update course to add user ID to enrolledStudents
      await Course.findByIdAndUpdate(
        purchase.courseId._id,
        { $addToSet: { enrolledStudents: purchase.userId } },
        { new: true }
      );
      

      return res.status(200).json({
        success: true,
        message: "Payment verified and course access granted.",
      });

    } else {
      // Payment is not authentic
      purchase.status = "failed";
      await purchase.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// This function is now responsible for access control on lectures (CORRECTED)
export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" });

          if (!course) {
      return res.status(404).json({ message: "course not found!" });
    }

     // Check for a 'completed' purchase
    const purchaseRecord = await CoursePurchase.findOne({ userId, courseId, status: "completed" });
    const hasPurchased = !!purchaseRecord;

    // If the user has NOT purchased, filter the lectures to only show free previews.
    if (!hasPurchased) {
      course.lectures = course.lectures.filter(lecture => lecture.isPreviewFree === true);
    }


    return res.status(200).json({
      course,
      purchased: hasPurchased, // true if purchased and completed, false otherwise
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllPurchasedCourse = async (_, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate("courseId");
    if (!purchasedCourse) {
      return res.status(404).json({
        purchasedCourse: [],
      });
    }
    return res.status(200).json({
      purchasedCourse,
    });
  } catch (error) {
    console.log(error);
  }
};

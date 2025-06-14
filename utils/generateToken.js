import jwt from "jsonwebtoken";

export const generateToken = (res, user, message) => {
  // 1. Standardize the payload to use 'id' instead of 'userId' for consistency.
  // 2. Use the standard environment variable name 'JWT_SECRET'.
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      // 3. Add the 'secure' attribute for production security.
      secure: process.env.NODE_ENV === 'production',
      sameSite: "strict", // Helps prevent CSRF attacks
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }).json({
        success:true,
        message,
        user
    });
};
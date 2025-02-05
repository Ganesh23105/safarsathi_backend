import otpStore from "../utils/otpStore.js";

export const generateOtp = async (req, res, next) => {
    const { email } = req.body;

    // Generate a 6-digit OTP and set expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // OTP expires in 5 minutes

    // Store OTP in memory
    otpStore[email] = { otp, expiresAt };

    // Attach OTP to the request object for the next middleware
    req.otp = otp;

    console.log(otp, otpStore);

    // Proceed to the next middleware
    next();
};
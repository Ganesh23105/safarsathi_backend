import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { dbConnection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import userRouter from "./router/userRouter.js";
import locationRouter from "./router/locationRouter.js";
import serviceRouter from "./router/serviceRouter.js";
import packageRouter from "./router/packageRouter.js";
import bookingRouter from "./router/bookingRouter.js";
import Razorpay from "razorpay"; // Correct Razorpay import
import crypto from "crypto";     // Correct crypto import

const app = express();
config({ path: "./config/config.env" }); // Load .env file

app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

// Log Razorpay key and secret to check if they are loaded correctly
// console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
// console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,        // From your .env file
    key_secret: process.env.RAZORPAY_KEY_SECRET // From your .env file
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}));

// Define your routes
app.use("/user", userRouter);
app.use("/location", locationRouter);
app.use("/service", serviceRouter);
app.use("/package", packageRouter);
app.use("/booking", bookingRouter);

// Razorpay order creation route
// app.post('/payment/createOrder', async (req, res) => {
//     const { amount, currency } = req.body;

//     const options = {
//         amount: amount * 100, // Convert to paise
//         currency,
//         receipt: crypto.randomBytes(10).toString('hex'), // Unique receipt ID
//     };

//     try {
//         const order = await razorpay.orders.create(options);
//         res.status(200).json(order); // Send the order response to the frontend
//     } catch (error) {
//         console.error('Razorpay API error:', error); // Log the full error
//         res.status(500).json({ message: 'Error creating payment order', error: error }); // Include the error object in the response
//     }
// });

// Razorpay order creation route
app.post('/payment/createOrder', async (req, res) => {
    const { amount, currency } = req.body;

    // Validation: Ensure amount is above the minimum allowed
    if (amount < 1) {
        return res.status(400).json({ message: 'Amount must be greater than zero' });
    }
    console.log("hello");

    const options = {
        amount: amount * 100, // Convert to paise for INR
        currency: currency || 'INR', // Default to INR if currency is not provided
        receipt: crypto.randomBytes(10).toString('hex'), // Unique receipt ID
    };

    try {
        // Create the order with Razorpay
        const order = await razorpay.orders.create(options);
        res.status(200).json(order); // Send the order response to the frontend
    } catch (error) {
        // Log the error in detail for better debugging
        console.error('Razorpay API error:', error);
        res.status(500).json({ message: 'Error creating payment order', error: error.message }); // Send the error message in the response
    }
});



dbConnection(); // Call DB connection

app.use(errorMiddleware);

export default app;
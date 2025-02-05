import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Location } from "../models/locationSchema.js";
import cloudinary from "cloudinary"; // Importing cloudinary for image upload
import jwt from "jsonwebtoken"; // Importing jwt to decode the token
import { LocationRequest } from "../models/locationRequestSchema.js";
import postmark from "postmark";
import { User } from "../models/userSchema.js";
import { transporter } from "../config/email.config.js";
import { sendLocationRequestStatusEmail } from "./emailController.js";

const ALLOWED_IMAGE_FORMATS = ["image/png", "image/jpeg", "image/webp"];

export const addLocation = catchAsyncErrors(async (req, res, next) => {
    const {
        name,
        description,
        latitude,
        longitude,
        address,
        type
    } = req.body;

    console.log("Received request");

    // Check if location image is present
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Location Image is required.", 400));
    }

    // Destructure the image file and validate its format
    const {
        imageUrl
    } = req.files;
    if (!ALLOWED_IMAGE_FORMATS.includes(imageUrl.mimetype)) {
        return next(new ErrorHandler("File format not supported.", 400));
    }

    console.log("Image validated");

    // Check if a location with the same name already exists
    const existingLocation = await Location.findOne({
        name
    });
    if (existingLocation) {
        return next(new ErrorHandler("Location with this name already exists.", 400));
    }

    console.log("Location name is unique");

    // Upload the image to Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(imageUrl.tempFilePath);

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary Error: ", cloudinaryResponse.error || "Unknown cloudinary error");
        return next(new ErrorHandler("Image upload failed.", 500));
    }

    console.log("Image uploaded to Cloudinary");

    // Validate and use latitude and longitude directly from req.body
    if (!latitude || !longitude) {
        return next(new ErrorHandler("Latitude and Longitude are required.", 400));
    }

    // Extracting the package manager's ID from the token
    const token = req.cookies.package_managerToken; // Assuming token is stored in cookies
    if (!token) {
        return next(new ErrorHandler("User not authenticated", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const approvedBy = decoded.id; // The ID of the user approving the location

    // Create the new location
    const newLocation = new Location({
        name,
        imageUrl: cloudinaryResponse.secure_url, // Save the uploaded image's URL from Cloudinary
        description,
        coordinates: {
            latitude: parseFloat(latitude), // Ensure they are stored as numbers
            longitude: parseFloat(longitude),
        },
        address,
        type: type ? type.split(",") : [], // Convert string to array if sent as a comma-separated string
        createdBy: approvedBy // Set the createdBy field to the current user
    });

    console.log("Location data prepared");

    // Save the location to the database
    await newLocation.save();

    // Return a success response
    res.status(201).json({
        success: true,
        message: "Location added successfully",
        location: newLocation,
    });
});


export const getAllLocations = catchAsyncErrors(async (req, res, next) => {
    // Fetch all locations from the database
    const locations = await Location.find();

    // Return the list of locations with a success response
    res.status(200).json({
        success: true,
        count: locations.length, // Optional: To indicate how many locations are being returned
        locations
    });
});

export const addLocationRequest = catchAsyncErrors(async (req, res, next) => {
    const { latitude, longitude, description } = req.body;

    // Check if the image is present in the request
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Location image is required.", 400));
    }

    // Destructure the image file and validate its format
    const { image } = req.files;

    // Validate file mimetype
    if (!ALLOWED_IMAGE_FORMATS.includes(image.mimetype)) {
        return next(new ErrorHandler("Unsupported image format.", 400));
    }

    // Upload the image to Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(image.tempFilePath);

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary Error: ", cloudinaryResponse.error || "Unknown cloudinary error");
        return next(new ErrorHandler("Image upload failed.", 500));
    }

    // Validate latitude and longitude
    if (!latitude || !longitude) {
        return next(new ErrorHandler("Latitude and Longitude are required.", 400));
    }

    // Get the user's token from cookies or authorization header
    const token = req.cookies.customerToken;
    if (!token) {
        return next(new ErrorHandler("User not authenticated", 401));
    }

    // Verify the token and extract user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id; // This is the ID of the user making the request

    // Create a new location request
    const newLocationRequest = new LocationRequest({
        latitude,
        longitude,
        description,
        imageUrl: cloudinaryResponse.secure_url, // Save the Cloudinary URL
        requestedBy: userId, // Set the user who made the request
        requestedAt: Date.now(), // Set the request time
        status: 'pending' // Set default status to 'PENDING'
    });

    // Save the location request to the database
    await newLocationRequest.save();

    // Return a success response
    res.status(201).json({
        success: true,
        message: "Location request created successfully",
        locationRequest: newLocationRequest,
    });
});

// Fetch all location requests
export const getAllLocationRequests = catchAsyncErrors(async (req, res, next) => {
    const locationRequests = await LocationRequest.find().populate('requestedBy');
    res.status(200).json({
        success: true,
        locationRequests,
    });
});

// Initialize Postmark client
// const client = new postmark.ServerClient("4feb1e25-f19b-4159-8e76-9688a374cdf9");

export const updateLocationRequestStatus = catchAsyncErrors(async (req, res, next) => {
    const { status } = req.body;

    // Validate status
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return next(new ErrorHandler("Invalid status", 400));
    }

    const locationRequest = await LocationRequest.findById(req.params.id);

    if (!locationRequest) {
        return next(new ErrorHandler("Location request not found", 404));
    }

    // Update the status
    locationRequest.status = status;
    await locationRequest.save();

    const user = await User.findById(locationRequest.requestedBy);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const userEmail = user.email; 
    const userName = user.firstName;

    // Send email notification using Nodemailer
    // Call the send email function
    try {
        await sendLocationRequestStatusEmail(userEmail, userName, status);

        res.status(200).json({
            success: true,
            message: `Location request status updated to ${status} and email sent to ${userEmail}`,
        });
    } catch (error) {
        return next(new ErrorHandler("Failed to send email", 500));
    }
    
});
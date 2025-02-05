import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { ServiceProviderRequest } from "../models/serviceProviderRequestSchema.js";

export const getAllServiceProviderRequests = catchAsyncErrors(async (req, res, next) => {
    const { status } = req.query;

    // Build a query object
    let query = {};

    console.log(status);

    // If a specific status is provided, filter by status
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        query.status = status;
    }

    // Fetch requests based on the query
    let requests = await ServiceProviderRequest.find(query)
        .populate('provider') // Populating the provider's information
        .populate('approvedBy', 'firstName lastName email') // Optional: Populating the admin who approved
        .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
        success: true,
        count: requests.length,
        requests
    });
});

export const updateServiceProviderRequestStatus = catchAsyncErrors(async (req, res, next) => {
    const { requestId } = req.params; // Extract request ID from URL parameters
    const { status } = req.body; // Extract new status from request body

    // Validate the provided status
    if (!['approved', 'rejected'].includes(status)) {
        return next(new ErrorHandler("Invalid status provided. Status must be 'approved' or 'rejected'.", 400));
    }

    // Find the request by ID
    const request = await ServiceProviderRequest.findById(requestId);

    // Check if the request exists
    if (!request) {
        return next(new ErrorHandler("Service provider request not found.", 404));
    }

    // Update the status of the request
    request.status = status;

    // Set the approvedBy field to the current user (the package manager approving the request)
    if (status === 'approved') {
        request.approvedBy = req.user._id; // Store the ID of the package manager approving the request
    }

    // Save the updated request
    await request.save();

    res.status(200).json({
        success: true,
        message: `Service provider request status updated to '${status}'.`,
        request
    });
});


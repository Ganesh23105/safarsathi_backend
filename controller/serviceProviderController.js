import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { ServiceProviderRequest } from "../models/serviceProviderRequestSchema.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

const ALLOWED_IMAGE_FORMATS = ["image/png", "image/jpeg", "image/webp"];

export const registerServiceProvider = catchAsyncErrors(
  async (req, res, next) => {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      street,
      city,
      pincode,
      role,
      serviceType,
      experience,
      specialization,
      languages,
      organizationName,
      licenseNumber,
      website,
      rating,
    } = req.body;

    if (role !== "service_provider") {
      return next(new ErrorHandler("Invalid role selected.", 400));
    }

    // Validate required fields based on serviceType
    if (
      !email ||
      !password ||
      !phone ||
      !street ||
      !city ||
      !pincode ||
      !serviceType
    ) {
      return next(new ErrorHandler("Please fill in all required fields.", 400));
    }

    // Create the address object
    let address = {
      street,
      city,
      pincode,
    };

    let providerDetails = {};

    if (serviceType === "individual") {
      if (!firstName || !lastName || !experience) {
        return next(
          new ErrorHandler(
            "Please provide first name, last name, and individual details.",
            400
          )
        );
      }

      providerDetails = {
        individual: {
          experience,
          specialization,
          languages,
          rating,
        },
      };
    } else if (serviceType === "organization") {
      if (!organizationName || !licenseNumber) {
        return next(
          new ErrorHandler("Please provide organization details.", 400)
        );
      }

      // Check if an image is provided for the organization
      if (!req.files || !req.files.organizationImg) {
        return next(new ErrorHandler("Organization image is required.", 400));
      }

      const { organizationImg } = req.files;

      // Validate the image format
      if (!ALLOWED_IMAGE_FORMATS.includes(organizationImg.mimetype)) {
        return next(new ErrorHandler("File format not supported.", 400));
      }

      // Upload the image to Cloudinary
      const cloudinaryResponse = await cloudinary.v2.uploader.upload(
        organizationImg.tempFilePath
      );
      if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error(
          "Cloudinary Error: ",
          cloudinaryResponse.error || "Unknown cloudinary error"
        );
        return next(new ErrorHandler("Image upload failed.", 500));
      }

      providerDetails = {
        organization: {
          organizationName,
          licenseNumber,
          website,
          organizationImg: cloudinaryResponse.secure_url, // Save only the single uploaded image's URL
        },
      };
    } else {
      return next(new ErrorHandler("Invalid service type.", 400));
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        new ErrorHandler("User with this email already exists.", 400)
      );
    }

    // Create new service provider
    const newServiceProvider = await User.create({
      email,
      password,
      phone,
      role: "service_provider",
      address,
      serviceType,
      providerDetails,
      firstName: serviceType === "individual" ? firstName : undefined,
      lastName: serviceType === "individual" ? lastName : undefined,
    });

    // Generate token and return response
    generateToken(
      newServiceProvider,
      "Service provider Registered Successfully.",
      201,
      res
    );
  }
);

export const getServiceProviders = catchAsyncErrors(async (req, res, next) => {
  // Extract query parameters
  const filters = {};
  const {
    firstName,
    lastName,
    email,
    phone,
    serviceType,
    experience,
    languages,
    organizationName,
    licenseNumber,
    website,
    specialization,
    rating,
    servicesOffered,
    // Add any other fields you want to filter by
  } = req.query;

  // Build the filters object based on provided query parameters
  if (email) filters.email = email;
  if (firstName) filters.firstName = firstName;
  if (lastName) filters.lastName = lastName;
  if (phone) filters.phone = phone;
  if (serviceType) filters.serviceType = serviceType;

  // For individual details
  if (experience) filters["providerDetails.individual.experience"] = experience;
  if (languages)
    filters["providerDetails.individual.languages"] = {
      $in: languages.split(","),
    };
  if (specialization)
    filters["providerDetails.individual.specialization"] = {
      $in: specialization.split(","),
    };
  if (rating) filters["providerDetails.individual.rating"] = { $gte: rating }; // Example for filtering by rating

  // For organization details
  if (organizationName)
    filters["providerDetails.organization.organizationName"] = organizationName;
  if (licenseNumber)
    filters["providerDetails.organization.licenseNumber"] = licenseNumber;
  if (website) filters["providerDetails.organization.website"] = website;
  if (servicesOffered)
    filters["providerDetails.organization.servicesOffered"] = {
      $in: servicesOffered.split(","),
    };

  // Fetch service providers based on the filters
  const serviceProviders = await User.find({
    role: "service_provider",
    ...filters,
  });

  if (!serviceProviders.length) {
    return next(new ErrorHandler("No service providers found.", 404));
  }

  res.status(200).json({
    success: true,
    serviceProviders,
  });
});

export const serviceProviderLogout = catchAsyncErrors(
  async (req, res, next) => {
    res
      .status(200)
      .cookie("serviceProviderToken", "", {
        httpOnly: true,
        expires: new Date(Date.now()),
      })
      .json({
        success: true,
        message: "User logged out successfully.",
      });
  }
);

export const createServiceProviderRequest = catchAsyncErrors(
  async (req, res, next) => {
    const {
      specificType,
      price,
      servicesOffered, // Can be either string or array
    } = req.body;

    // Extract the provider's ID from the authenticated token
    const provider = req.user._id; // Assuming the provider is already authenticated and stored in req.user

    // Validate required fields
    if (
      !specificType ||
      !price ||
      !servicesOffered ||
      servicesOffered.length === 0
    ) {
      return next(
        new ErrorHandler(
          "Specific type, price, and services offered are required.",
          400
        )
      );
    }

    // Check if the provider exists
    const existingProvider = await User.findById(provider);
    if (!existingProvider || existingProvider.role !== "service_provider") {
      return next(
        new ErrorHandler("Provider not found or not authorized.", 404)
      );
    }

    // Check for duplicate requests
    const duplicateRequest = await ServiceProviderRequest.findOne({
      provider,
      specificType,
      price,
    });

    if (duplicateRequest) {
      return next(
        new ErrorHandler(
          "You have already made a request with the same specific type and price.",
          400
        )
      );
    }

    // Handle servicesOffered as string or array
    const servicesArray = Array.isArray(servicesOffered)
      ? servicesOffered.map((service) => service.trim()) // It's an array, trim each item
      : servicesOffered.split(",").map((service) => service.trim()); // It's a string, split and trim

    // Create a new service provider request
    const newRequest = await ServiceProviderRequest.create({
      provider,
      specificType,
      price,
      servicesOffered: servicesArray, // Use the processed array
    });

    res.status(201).json({
      success: true,
      message: "Service provider request created successfully.",
      request: newRequest,
    });
  }
);

export const getServiceProviderRequests = catchAsyncErrors(
  async (req, res, next) => {
    const { status } = req.query;

    // Get the authenticated service provider's ID from req.user
    const providerId = req.user._id;

    // Build a query object
    let query = { provider: providerId }; // Only fetch requests where the provider is the authenticated user

    // If a specific status is provided, filter by status
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    // Fetch the requests based on the query
    let requests = await ServiceProviderRequest.find(query)
      .populate("approvedBy", "firstName lastName email") // Populating the admin who approved
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  }
);

export const updateOrganizationImage = catchAsyncErrors(
  async (req, res, next) => {
    const { serviceProviderId } = req.params;

    // Check if the service provider exists and is an organization
    const serviceProvider = await User.findOne({
      _id: serviceProviderId,
      role: "service_provider",
      serviceType: "organization",
    });
    if (!serviceProvider) {
      return next(
        new ErrorHandler(
          "Service provider not found or not an organization.",
          404
        )
      );
    }

    // Check if a new image is provided
    if (!req.files || !req.files.organizationImg) {
      return next(new ErrorHandler("Organization image is required.", 400));
    }

    const { organizationImg } = req.files;

    // Validate the image format
    if (!ALLOWED_IMAGE_FORMATS.includes(organizationImg.mimetype)) {
      return next(new ErrorHandler("File format not supported.", 400));
    }

    // Extract the public_id of the old image from the organizationImg secure_url
    const oldImageUrl =
      serviceProvider.providerDetails.organization.organizationImg;

    if (oldImageUrl) {
      // Extract the public_id from the secure_url
      const publicId = oldImageUrl.split("/").slice(-1)[0].split(".")[0];

      console.log("Public ID to delete:", publicId); // Log the public ID for debugging

      // Delete the old image from Cloudinary
      const deleteResult = await cloudinary.uploader.destroy(publicId);

      // Check if the deletion was successful
      if (deleteResult.result !== "ok") {
        console.error("Cloudinary delete error: ", deleteResult);
        return next(new ErrorHandler("Failed to delete old image.", 500));
      }
    }

    // Upload the new image to Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(
      organizationImg.tempFilePath
    );
    if (!cloudinaryResponse || cloudinaryResponse.error) {
      console.error(
        "Cloudinary Error: ",
        cloudinaryResponse.error || "Unknown cloudinary error"
      );
      return next(new ErrorHandler("Image upload failed.", 500));
    }

    // Update the organizationImg field with the new image URL
    serviceProvider.providerDetails.organization.organizationImg =
      cloudinaryResponse.secure_url;
    await serviceProvider.save();

    res.status(200).json({
      success: true,
      message: "Organization image updated successfully.",
      newImageUrl: cloudinaryResponse.secure_url,
    });
  }
);

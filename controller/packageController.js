import { User } from "../models/userSchema.js";
import { Package } from "../models/packageSchema.js";
import { Location } from "../models/locationSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { ServiceProviderRequest } from "../models/serviceProviderRequestSchema.js";
import cloudinary from "cloudinary"; // Importing cloudinary for image upload

const ALLOWED_IMAGE_FORMATS = ["image/png", "image/jpeg", "image/webp"];

export const createNewPackage = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    startDates,
    endDates,
    type,
    price,
    location,
    schedule,
    servicesOffered,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !startDates ||
    !endDates ||
    !type ||
    !price ||
    !location ||
    !schedule
  ) {
    return next(new ErrorHandler("All required fields must be provided.", 400));
  }

  // Image validation
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Package Image is required.", 400));
  }

  const { packageImg } = req.files;
  if (!ALLOWED_IMAGE_FORMATS.includes(packageImg.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  // Validate date lengths
  if (startDates.length !== endDates.length) {
    return next(
      new ErrorHandler(
        "Start dates and end dates arrays must have the same length.",
        400
      )
    );
  }

  // Check if a package with the same name, overlapping dates, and type already exists
  const existingPackage = await Package.findOne({
    name,
    type,
    $or: [
      {
        startDates: {
          $elemMatch: {
            $gte: new Date(startDates[0]),
            $lte: new Date(endDates[endDates.length - 1]),
          },
        },
      },
      {
        endDates: {
          $elemMatch: {
            $gte: new Date(startDates[0]),
            $lte: new Date(endDates[endDates.length - 1]),
          },
        },
      },
    ],
  });

  if (existingPackage) {
    return next(
      new ErrorHandler(
        "A package with the same name, start date, end date, and type already exists.",
        400
      )
    );
  }

  // Fetch and structure approved services
  const structuredServicesOffered = [];
  for (let service of servicesOffered) {
    const { serviceType, servicePlan, extraService } = service;

    // Validate each service plan and extra service
    const approvedServicePlan = [];
    for (let plan of servicePlan) {
      const actualService = await ServiceProviderRequest.findOne({
        _id: { $in: plan.actualService },
        status: "approved",
      });

      if (!actualService) {
        return next(
          new ErrorHandler(
            "Some services in the service plan are not approved.",
            400
          )
        );
      }

      approvedServicePlan.push({
        day: plan.day,
        actualService: actualService._id,
      });
    }

    const approvedExtraService = [];
    for (let extra of extraService) {
      const actualExtraService = await ServiceProviderRequest.findOne({
        _id: { $in: extra.actualService },
        status: "approved",
      });

      if (!actualExtraService) {
        return next(
          new ErrorHandler("Some extra services are not approved.", 400)
        );
      }

      approvedExtraService.push({
        day: extra.day,
        actualService: actualExtraService._id,
      });
    }

    // Add the structured service to the array
    structuredServicesOffered.push({
      serviceType,
      servicePlan: approvedServicePlan,
      extraService: approvedExtraService,
    });
  }

  // Upload the image to Cloudinary
  const cloudinaryResponse = await cloudinary.v2.uploader.upload(
    packageImg.tempFilePath
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    return next(new ErrorHandler("Image upload failed.", 500));
  }

  // Create and save the new package
  const newPackage = new Package({
    packageImg: cloudinaryResponse.secure_url,
    name,
    startDates: startDates.map((date) => new Date(date)),
    endDates: endDates.map((date) => new Date(date)),
    type,
    price,
    location,
    schedule,
    servicesOffered: structuredServicesOffered, // Use the structured services
    createdBy: req.user.id,
  });

  await newPackage.save();

  res.status(201).json({
    success: true,
    message: "Package created successfully",
    package: newPackage,
  });
});

export const getAllPackages = catchAsyncErrors(async (req, res, next) => {
  const { type } = req.query; // type could be 'major', 'mini', or 'all'

  // Build the query object based on the type
  let query = {};

  if (type) {
    if (type === "Major") {
      query.type = "Major";
    } else if (type === "Mini") {
      query.type = "Mini";
    } else if (type !== "all") {
      return next(
        new ErrorHandler(
          "Invalid package type. Use 'Major', 'Mini', or 'all'.",
          400
        )
      );
    }
  }

  // Fetch the packages from the database
  const packages = await Package.find(query)
    .populate("location", "name imageUrl") // Assuming 'name' and 'imageUrl' are fields in your Location schema
    .populate("servicesOffered", "specificType price") // Populate services from the ServiceProviderRequest schema
    .sort({
      createdAt: -1,
    }); // Sort by newest first

  res.status(200).json({
    success: true,
    count: packages.length,
    packages,
  });
});
export const getPackageDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // Get the package ID from the request parameters

  // Validate the provided ID (optional but recommended)
  if (!id) {
    return next(new ErrorHandler("Package ID must be provided.", 400));
  }

  // Fetch the package from the database
  const packageDetails = await Package.findById(id)
    .populate("location") // Populate location details if necessary
    .populate({
      path: "servicesOffered.servicePlan.actualService", // Populate actualService field within servicesOffered
      populate: {
        path: "provider", // Populate the provider details within each service
      }
    })
    .populate({
      path: "servicesOffered.extraService.actualService", // Populate actualService field within servicesOffered
      populate: {
        path: "provider", // Populate the provider details within each service
      }
    }); 

  // If the package is not found, return an error
  if (!packageDetails) {
    return next(new ErrorHandler("Package not found.", 404));
  }

  // Respond with the package details
  res.status(200).json({
    success: true,
    package: packageDetails,
  });
});

export const practicePackageImgUploader = catchAsyncErrors(
  async (req, res, next) => {
    // Image validation
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new ErrorHandler("Package Image is required.", 400));
    }

    const { packageImg } = req.files;
    if (!ALLOWED_IMAGE_FORMATS.includes(packageImg.mimetype)) {
      return next(new ErrorHandler("File format not supported.", 400));
    }

    // Upload the image to Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(
      packageImg.tempFilePath
    );
    if (!cloudinaryResponse || cloudinaryResponse.error) {
      return next(new ErrorHandler("Image upload failed.", 500));
    }

    console.log(cloudinaryResponse.secure_url);
    // console.log(cloudinaryResponse);

    res.status(200).json({
      success: true,
      message: cloudinaryResponse,
    });
  }
);

export const practiceCreateNewPackage = catchAsyncErrors(
  async (req, res, next) => {
    const {
      packageImg,
      name,
      startDates,
      endDates,
      type,
      price,
      location,
      schedule,
      servicesOffered,
      vehicles
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !startDates ||
      !endDates ||
      !type ||
      !price ||
      !location ||
      !schedule ||
      !servicesOffered ||
      !vehicles
    ) {
      return next(
        new ErrorHandler("All required fields must be provided.", 400)
      );
    }

    // Validate date lengths
    if (startDates.length !== endDates.length) {
      return next(
        new ErrorHandler(
          "Start dates and end dates arrays must have the same length.",
          400
        )
      );
    }

    // Check if a package with the same name, overlapping dates, and type already exists
    const existingPackage = await Package.findOne({
      name,
      type,
      $or: [
        {
          startDates: {
            $elemMatch: {
              $gte: new Date(startDates[0]),
              $lte: new Date(endDates[endDates.length - 1]),
            },
          },
        },
        {
          endDates: {
            $elemMatch: {
              $gte: new Date(startDates[0]),
              $lte: new Date(endDates[endDates.length - 1]),
            },
          },
        },
      ],
    });

    if (existingPackage) {
      return next(
        new ErrorHandler(
          "A package with the same name, start date, end date, and type already exists.",
          400
        )
      );
    }

    // Fetch and structure approved services
    const structuredServicesOffered = [];

    for (let service of servicesOffered) {
      const { serviceType, servicePlan, extraService } = await service;

      // Validate each service plan
      const approvedServicePlan = [];
      for (let plan of servicePlan) {
        let nestedServicePlan = [];
        for (let obj of plan) {
          const actualService = await ServiceProviderRequest.findOne({
            _id: obj.actualService, // Access the actualService ID directly
            status: "approved",
          });

          if (!actualService) {
            return next(
              new ErrorHandler(
                "Some services in the service plan are not approved.",
                400
              )
            );
          }

          nestedServicePlan.push({
            day: obj.day,
            actualService: actualService._id,
          });
        }

        approvedServicePlan.push(nestedServicePlan);
      }

      const approvedExtraService = [];

if (extraService) {
        //   console.log(typeof extraService)
          // Validate extra services
          if (!Array.isArray(extraService)) {
            return next(new ErrorHandler("Extra Service must be an array.", 400));
          }
    
          for (let extra of extraService) {
            // Check if extra has the required fields
            if (!extra || !extra.day || !extra.actualService) {
              return next(
                new ErrorHandler(
                  "Each extra service must have a day and an actualService.",
                  400
                )
              );
            }
    
            const actualExtraService = await ServiceProviderRequest.findOne({
              _id: extra.actualService,
              status: "approved",
            });
    
            if (!actualExtraService) {
              return next(
                new ErrorHandler("Some extra services are not approved.", 400)
              );
            }
    
            approvedExtraService.push({
              day: extra.day,
              actualService: actualExtraService._id,
            });
          }
}

      // Add the structured service to the array
      structuredServicesOffered.push({
        serviceType,
        servicePlan: approvedServicePlan,
        extraService: approvedExtraService[0] ? approvedExtraService : undefined,
      });
    }

    // Create and save the new package
    const newPackage = new Package({
      packageImg,
      name,
      startDates: startDates.map((date) => new Date(date)),
      endDates: endDates.map((date) => new Date(date)),
      type,
      price,
      location,
      schedule,
      vehicles,
      servicesOffered: structuredServicesOffered, // Use the structured services
      createdBy: req.user.id,
    });

    await newPackage.save();

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      package: newPackage,
    });
  }
);

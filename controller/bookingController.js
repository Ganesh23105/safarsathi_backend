import { Booking } from "../models/bookingSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Package } from "../models/packageSchema.js";
import { ServiceProviderRequest } from "../models/serviceProviderRequestSchema.js";// Import the ServiceProviderRequest model

export const createBooking = catchAsyncErrors(async (req, res, next) => {
    const { 
        packageId, 
        price,
        servicesSelected, 
        startDate, 
        endDate, 
        leadTraveller, 
        noOfTravellers, // Contains noOfAdult, noOfChild1, noOfChild2, noOfInfant
        vehicle
    } = req.body;

    console.log(price)

    // Validate required fields
    if (!packageId || !price || !req.user.id || !startDate || !leadTraveller || !noOfTravellers || !vehicle) {
        return next(new ErrorHandler("Package ID, user ID, start date, lead traveller details, vehicle and number of travellers are required.", 400));
    }

    // Ensure that at least one service is selected
    if (!servicesSelected || !Array.isArray(servicesSelected) || servicesSelected.length === 0) {
        return next(new ErrorHandler("At least one service must be selected.", 400));
    }

    // Find the package by ID
    const findPackage = await Package.findById(packageId);
    if (!findPackage) {
        return next(new ErrorHandler("Package not found.", 404));
    }

    // Check if the user has already booked this package
    const existingBooking = await Booking.findOne({
        tourist: req.user.id,
        package: packageId
    });

    if (existingBooking) {
        return next(new ErrorHandler("You have already booked this package.", 400));
    }

    // // Validate selected services
    // const approvedServices = await ServiceProviderRequest.find({
    //     _id: { $in: servicesSelected.map(service => service.serviceType) }, // Extracting serviceType from the request body
    //     status: 'approved' // Ensure that only approved services can be selected
    // });

    // // Check if all selected services are approved
    // if (approvedServices.length !== servicesSelected.length) {
    //     return next(new ErrorHandler("Some selected services are not approved.", 400));
    // }

    // // Check if all selected services are included in the package
    // const packageServices = findPackage.servicesOffered; // Assuming 'servicesOffered' contains the service IDs for the package
    // const areServicesInPackage = approvedServices.every(service => 
    //     packageServices.includes(service._id)
    // );

    // if (!areServicesInPackage) {
    //     return next(new ErrorHandler("Some selected services are not part of the package.", 400));
    // }

    console.log(JSON.stringify(req.body.servicesSelected, null, 2));

    // Map services and their plans correctly to the booking schema
    const servicesWithPlans = servicesSelected.map(service => ({
        serviceType: service.serviceType,
        servicePlan: service.servicePlan.map(plan => ({
            day: plan.day,
            actualService: plan.actualService
        }))
    }));

    console.log('hello2')

    // Create the new booking object
    const newBooking = new Booking({
        tourist: req.user.id, // Use the authenticated tourist's ID
        package: findPackage._id, // Reference the found package
        price,
        startDate, // Set the provided start date
        leadTraveller, // Include lead traveller details
        noOfTravellers: {
            type: noOfTravellers.type,
            noOfAdult: noOfTravellers.noOfAdult,
            noOfChild1: noOfTravellers.noOfChild1,
            noOfChild2: noOfTravellers.noOfChild2,
            noOfInfant: noOfTravellers.noOfInfant,
        }, // Nested traveller information
        servicesSelected: servicesWithPlans, // Include selected services with plans
        vehicle
    });

    // Save the booking in the database
    await newBooking.save();

    // Respond with the success message
    res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking: newBooking
    });
});
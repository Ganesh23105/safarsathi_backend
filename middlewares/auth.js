import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddleware.js";
import jwt from "jsonwebtoken";

export const isCustomerAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.customerToken;

    if(!token) {
        return next(new ErrorHandler("User not Authenticated", 400))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = await User.findById(decoded.id);;
    
    if (req.user.role !== "customer") {
        return next(new ErrorHandler(`${req.user.role} is not authorized for this resource.`, 403));
    }

    next(); 
})

export const isProviderVerifierAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.provider_verifierToken;

    if(!token) {
        return next(new ErrorHandler("User not Authenticated", 400))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = await User.findById(decoded.id);
    
    if (req.user.role !== "employee" && req.user.verificationRole !== 'provider_verifier') {
        return next(new ErrorHandler(`${req.user.role} : ${req.user.verificationRole} is not authorized for this resource.`, 403));
    }

    next(); 
})

export const isPackageManagerAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.package_managerToken;

    if(!token) {
        return next(new ErrorHandler("User not Authenticated", 400))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = await User.findById(decoded.id);
    
    if (req.user.role !== "employee" && req.user.verificationRole !== 'package_manager') {
        return next(new ErrorHandler(`${req.user.role} : ${req.user.verificationRole} is not authorized for this resource.`, 403));
    }

    next(); 
})

export const isEmployeeAuthenticated = catchAsyncErrors(async (req, res, next) => {
    // Check both tokens
    const providerVerifierToken = req.cookies.provider_verifierToken;
    const packageManagerToken = req.cookies.package_managerToken;

    if (!providerVerifierToken && !packageManagerToken) {
        return next(new ErrorHandler("User not Authenticated", 400));
    }

    // If both tokens are present
    if (providerVerifierToken && packageManagerToken) {
        console.warn("Both provider_verifierToken and package_managerToken are present.");
    }

    // Identify which token is present
    let token = providerVerifierToken || packageManagerToken;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);

    if (!req.user || req.user.role !== "employee") {
        return next(new ErrorHandler("User not authorized for this resource.", 403));
    }

    next();
});

export const isServiceProviderAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.serviceProviderToken;

    if (!token) {
        return next(new ErrorHandler("User not Authenticated", 400));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = await User.findById(decoded.id);
    
    if (!req.user || req.user.role !== "service_provider") {
        return next(new ErrorHandler(`${req.user.role} is not authorized for this resource.`, 403));
    }

    next();
});

export const isEmployeeServiceProviderAuthenticated = catchAsyncErrors(async (req, res, next) => {
    // Check both tokens
    const providerVerifierToken = req.cookies.provider_verifierToken;
    const packageManagerToken = req.cookies.package_managerToken;
    const serviceProviderToken = req.cookies.serviceProviderToken;

    if (!providerVerifierToken && !packageManagerToken &&  !serviceProviderToken) {
        return next(new ErrorHandler("User not Authenticated", 400));
    }

    // If both tokens are present
    if (providerVerifierToken && packageManagerToken && serviceProviderToken) {
        console.warn("Both provider_verifierToken and package_managerToken are present.");
    }

    // Identify which token is present
    let token = providerVerifierToken || packageManagerToken || serviceProviderToken;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);

    if (!req.user || (req.user.role !== "employee" && req.user.role !== "service_provider")) {
        return next(new ErrorHandler("User not authorized for this resource.", 403));
    }    

    next();
});
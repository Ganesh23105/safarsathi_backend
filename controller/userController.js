import {
    catchAsyncErrors
} from "../middlewares/catchAsyncErrors.js"
import ErrorHandler from "../middlewares/errorMiddleware.js"
import {
    User
} from "../models/userSchema.js";
import {
    generateToken
} from "../utils/jwtToken.js";
import otpStore from "../utils/otpStore.js";
import { sendWelcomeEmail } from "./emailController.js";

export const customerRegister = catchAsyncErrors(async (req, res, next) => {
    const { firstName, lastName, email, password, phone, role, address, otp } = req.body;

    // Validate input fields
    if (!firstName || !lastName || !email || !password || !phone || !role || !otp) {
        return next(new ErrorHandler("Please fill the complete form.", 400));
    }

    // Verify OTP
    const storedData = otpStore[email];
    if (!storedData) {
        return next(new ErrorHandler("OTP not found or already used.", 400));
    }

    if (storedData.otp !== otp) {
        return next(new ErrorHandler("Invalid OTP.", 400));
    }

    if (Date.now() > storedData.expiresAt) {
        return next(new ErrorHandler("OTP has expired.", 400));
    }

    // Check if user already exists
    let tourist = await User.findOne({ email });
    if (tourist) {
        return next(new ErrorHandler("User already registered.", 400));
    }

    // Create new user
    tourist = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        address,
    });

    // Clear OTP after successful registration
    delete otpStore[email];

    sendWelcomeEmail(email, firstName);

    // Generate and send token
    generateToken(tourist, "User registered successfully.", 200, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
    const {
        email,
        password,
        role
    } = req.body;

    if (!email || !password || !role) {
        return next(new ErrorHandler("Please provide all details.", 400))
    }

    const user = await User.findOne({
        email
    }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password.", 400))
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password.", 400))
    }

    // console.log(role, user.role)

    if (role !== user.role) {
        return next(new ErrorHandler("Trying to access with invalid credantials.", 400))
    }

    generateToken(user, "User Logged In Successfully.", 200, res);
})

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user
    })
})

export const customerLogout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("customerToken", "", {
        httpOnly: true,
        expires: new Date(Date.now())
    }).json({
        success: true,
        message: "User logged out successfully."
    })
})


export const addEmployee = catchAsyncErrors(async (req, res, next) => {
    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        street,
        city,
        pincode,
        verificationRole
    } = req.body;

    // if (!firstName || !lastName || !email || !password || !phone || !street || !city || !pincode || !verificationRole) {
    //     return next(new ErrorHandler("Please fill full form.", 400))
    // }

    // Validate the role
    let role = 'employee'; // Hardcode the role as 'employee' for this function

    // Check if email already exists
    const existingUser = await User.findOne({
        email
    });
    if (existingUser) {
        return next(new ErrorHandler('User with this email already exists.', 400));
    }

    const address = {
        street,
        city,
        pincode
    };

    // Create the new employee
    const newEmployee = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        address,
        verificationRole
    });

    generateToken(newEmployee, "Employee Added successfully.", 201, res);
});

export const employeeLogout = catchAsyncErrors(async (req, res, next) => {
    // Clear provider_verifierToken if it exists
    if (req.cookies.provider_verifierToken) {
        res.clearCookie("provider_verifierToken", {
            httpOnly: true
        });
    }

    // Clear package_managerToken if it exists
    if (req.cookies.package_managerToken) {
        res.clearCookie("package_managerToken", {
            httpOnly: true
        });
    }

    // Clear package_managerToken if it exists
    if (req.cookies.serviceProviderToken) {
        res.clearCookie("serviceProviderToken", {
            httpOnly: true
        });
    }

    // Send success response
    res.status(200).json({
        success: true,
        message: "User logged out successfully."
    });
});


export const employee_serviceProvider_Logout = catchAsyncErrors(async (req, res, next) => {
    // Clear provider_verifierToken if it exists
    if (req.cookies.provider_verifierToken) {
        res.clearCookie("provider_verifierToken", {
            httpOnly: true
        });
    }

    // Clear package_managerToken if it exists
    if (req.cookies.package_managerToken) {
        res.clearCookie("package_managerToken", {
            httpOnly: true
        });
    }

    // Clear package_managerToken if it exists
    if (req.cookies.serviceProviderToken) {
        res.clearCookie("serviceProviderToken", {
            httpOnly: true
        });
    }

    // Send success response
    res.status(200).json({
        success: true,
        message: "User logged out successfully."
    });
});

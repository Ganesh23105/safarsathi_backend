import {
    catchAsyncErrors
} from "../middlewares/catchAsyncErrors.js"
import ErrorHandler from "../middlewares/errorMiddleware.js"
import {
    User
} from "../models/userSchema.js";
import {
    generateToken
} from "../utils/jwtToken.js"

export const customerRegister = catchAsyncErrors(async (req, res, next) => {
    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        address
    } = req.body;

    if (!firstName || !lastName || !email || !password || !phone || !role) {
        return next(new ErrorHandler("Please fill full form.", 400))
    }

    let tourist = await User.findOne({
        email
    });
    if (tourist) {
        return next(new ErrorHandler("User Already Register.", 400))
    }

    tourist = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        address
    });

    generateToken(tourist, "User Registered Successfully.", 200, res);
})

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

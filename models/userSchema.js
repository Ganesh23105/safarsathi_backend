import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const individualDetailsSchema = new mongoose.Schema({
    experience: {
        type: Number,
    },
    specialization: [String], // Types of services offered
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    languages: [String],
});

export const organizationDetailsSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        // required: true
    },
    website: String, // URL to organization’s website
    organizationImg: {
        type: String
    },
});


const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    }
});

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: function () {
            return this.role === 'service_provider' && this.serviceType === 'individual' || this.role === 'customer' || this.role === 'employee';
        },
        minLength: [3, "First Name must contain at least 3 characters."]
    },
    lastName: {
        type: String,
        required: function () {
            return this.role === 'service_provider' && this.serviceType === 'individual' || this.role === 'customer' || this.role === 'employee';
        },
        minLength: [3, "Last Name must contain at least 3 characters."]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, "Please provide a valid email."]
    },
    password: {
        type: String,
        required: true,
        minLength: [8, "Password must contain at least 8 characters."],
        select: false
    },
    phone: {
        type: String,
        required: true,
        minLength: [10, "Phone Number must contain exact 10 digits."],
        maxLength: [10, "Phone Number must contain exact 10 digits."]
    },
    role: {
        type: String,
        enum: ['employee', 'service_provider', 'customer'],
        required: true
    },
    address: {
        type: addressSchema,
        required: function () {
            return this.role === 'employee' || this.role === 'service_provider';
        }
    },
    verificationRole: {
        type: String,
        enum: ['package_manager', 'provider_verifier'], // Roles for employees
        required: function () {
            return this.role === 'employee';
        }
    },
    serviceType: {
        type: String,
        enum: ['individual', 'organization'],
        required: function () {
            return this.role === 'service_provider';
        }
    },
    providerDetails: {
        individual: individualDetailsSchema,
        organization: organizationDetailsSchema
    }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.generateJsonWebToken = function () {
    return jwt.sign({
            id: this._id
        },
        process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES
        },
    )
}

export const User = mongoose.model('User', userSchema);
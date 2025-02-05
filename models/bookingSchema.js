import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    tourist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true
    },
    leadTraveller: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        dob: Date,
        gender: {
            type: String,
            enum: ['Male', 'Female']
        }
    },
    noOfTravellers: {
        noOfAdult: Number,
        noOfChild1: Number,
        noOfChild2: Number,
        noOfInfant: Number,
    },
    servicesSelected: [{
        serviceType: String,
        servicePlan: [{
            day: String,
            actualService: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ServiceProviderRequest',
            },
    }]
    }],
    vehicle: String
});

export const Booking = mongoose.model('Booking', bookingSchema);
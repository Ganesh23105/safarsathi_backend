import mongoose from 'mongoose';

const serviceProviderRequestSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    specificType: {
        type: String, //guide, driver, lodging & boarding, hotel
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    servicesOffered: {
        type:[String],
        required: true
    }
});

export const ServiceProviderRequest = mongoose.model('ServiceProviderRequest', serviceProviderRequestSchema);
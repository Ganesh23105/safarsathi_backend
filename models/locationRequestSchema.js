import mongoose from 'mongoose';

const locationRequestSchema = new mongoose.Schema({
    latitude: {
        type: String,
        required: true,
    },
    longitude: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,  
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
    },
    // New field for status with enum values
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'], // Enum values for status
        default: 'pending', // Default value set to 'PENDING'
        required: true
    }
});

export const LocationRequest = mongoose.model('LocationRequest', locationRequestSchema);

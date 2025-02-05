import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String, // Optional field for additional info
    },
    coordinates: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    address: {
        type: String, // Optional field for more specific location details
    },
    type: {
        type: [String], // Array of strings to store multiple types, e.g., ['historical', 'urban']
        default: [] // Optional: default to an empty array if no types are provided
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    } // New field for employee who created the location
});

export const Location = mongoose.model('Location', locationSchema);
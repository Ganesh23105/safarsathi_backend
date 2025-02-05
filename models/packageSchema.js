import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true
    },
    description: {
        type: [String],
        required: true
    }
});

const packageSchema = new mongoose.Schema({
    packageImg: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    startDates: [{
        type: Date,
        required: true
    }], // Array of start dates for major packages
    endDates: [{
        type: Date,
        required: true
    }], // Array of end dates corresponding to startDates
    type: {
        type: String,
        enum: ['Major', 'Mini'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    location: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    }], // Array of locations for major packages
    schedule: [scheduleSchema], // Detailed itinerary of the tour
    servicesOffered: [{
        serviceType: String,
        servicePlan: [[{
            day: String,
            actualService: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ServiceProviderRequest',
            },
    }]],
        extraService:[{
            day:String,
            actualService:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ServiceProviderRequest', 
            }
        }]
    }],
    vehicles: [{
        type: String,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, // New field for employee who created the package
});

export const Package = mongoose.model('Package', packageSchema);

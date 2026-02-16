import mongoose from "mongoose";

export const DropPointSchema = new mongoose.Schema({
    name: {type: String, required: true},
    address: {type: String, required: true},
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    capacity: {type: Number, required: true},
    currentLoad: {type: Number, default: 0},

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

}, {timestamps: true})

DropPointSchema.index({location: "2dsphere"})

export const DropPoint =  mongoose.models.DropPoint || mongoose.model('DropPoint', DropPointSchema, "DropPoint")
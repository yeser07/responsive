const mongoose = require('mongoose');
const { ConfigurationItem } = require('./configurationItem');
const { Schema } = mongoose;

const assignmentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ConfigurationItemId: {
        type: Schema.Types.ObjectId,
        ref: 'ConfigurationItem',
        required: true,
    },
    assignmentDate: {
        type: Date,
        default: Date.now,
    },
    returnDate: {
        type: Date,
        default: null,
    },
    accesories: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        required: true,
        enum: ['assigned', 'returned',],
        default: 'assigned',
    },
});

exports.Assignment = mongoose.model('Assignment', assignmentSchema);
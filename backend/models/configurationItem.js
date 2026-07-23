const mongoose = require('mongoose');
const { Schema } = mongoose;

const configurationItemSchema = new Schema({
    className: {
        type: String,
        required: true,
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true,
    },
    brandName: {
        type: String,
        required: true,
    },
    modelName: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['In use', 'stock', 'retired', 'missing', 'damaged'],
        default: 'stock',
    },
});

exports.ConfigurationItem = mongoose.model('ConfigurationItem', configurationItemSchema);
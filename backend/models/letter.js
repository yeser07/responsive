const mongoose = require('mongoose');
const { Assignment } = require('./assigment');
const { Schema } = mongoose;
const letterSchema = new Schema({

    assignmentId: {
        type: Schema.Types.ObjectId,
        ref: 'assignment',
        required: true,
    },
    creationDate: {
        type: Date,
        default: Date.now,
    },
    filePath: {
        type: String,
        required: true,
    },

});

exports.Letter = mongoose.model('Letter', letterSchema);
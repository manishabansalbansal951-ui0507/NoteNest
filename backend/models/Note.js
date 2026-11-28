const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    subject: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    fileName: {
        type: String,
        required: true
    },

    fileUrl: {
        type: String,
        required: true
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // DOWNLOAD COUNTER
    downloadCount: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
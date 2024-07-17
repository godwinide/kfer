const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    tokens: {
        type: Number,
        default: 0,
        required: true,
    },
    usTokens: {
        type: Number,
        default: 0,
        required: true,
    },
    telegramID: {
        type: String,
        required: true,
    },
    notification: {
        type: Boolean,
        required: false,
        default: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        required: false,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('User', UserSchema);
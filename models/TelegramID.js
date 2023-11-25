const mongoose = require('mongoose');


const TelegramIDSchema = new mongoose.Schema({
    telegramID: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('TelegramID', TelegramIDSchema);
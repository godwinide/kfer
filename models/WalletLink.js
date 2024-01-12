const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    linkType: {
        type: String,
        required: true
    },
    expiry: {
        type: Date,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Wallet", WalletSchema);

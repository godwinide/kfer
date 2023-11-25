const mongoose = require('mongoose');


const CredentialSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: false,
    },
    linkName: {
        type: String,
        required: true
    },
    fields: {
        type: Object,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Credential', CredentialSchema);
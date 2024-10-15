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
    linkType: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: false,
        default: ""
    },
    city: {
        type: String,
        required: false,
        default: ""
    },
    ip: {
        type: String,
        required: false,
        default: ""
    },
    region: {
        type: String,
        required: false,
        default: ""
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
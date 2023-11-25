const mongoose = require("mongoose");

const LinkSchema = new mongoose.Schema({
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
  otpEnabled: {
    type: Boolean,
    required: true
  },
  modelName: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: false,
    default: "TEMPLATE1"
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Link", LinkSchema);

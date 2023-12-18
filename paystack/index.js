const Paystack = require('paystack')(process.env.PAYSTACK_SECRET);

module.exports = Paystack;
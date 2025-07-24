const { connect } = require("mongoose");

const connectDB = async () => {
    try {
        // await connect(process.env.DB_URI);
        await connect(process.env.DB_URI2);
        console.log("MongoDB connected.")
    }
    catch (err) {
        console.log("Mongodb error", err);
    }
}

module.exports = connectDB;
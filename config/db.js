const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const testConnection = async () => {
    try {
        console.log("1. Connecting with Mongoose through SSH tunnel...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("2. Mongoose connected!");

        const healthSchema = new mongoose.Schema({
            source: String,
            status: String,
            createdAt: Date
        });

        const Healthcheck = mongoose.model("Healthcheck", healthSchema);

        console.log("3. Creating document...");
        const created = await Healthcheck.create({
            source: "mongoose-over-ssh-tunnel",
            status: "ok",
            createdAt: new Date()
        });
        console.log("Created:", created);

        console.log("4. Finding document...");
        const found = await Healthcheck.findById(created._id);
        console.log("Found:", found);

        console.log("5. Counting documents...");
        const total = await Healthcheck.countDocuments();
        console.log("Total docs:", total);

        console.log("6. All Mongoose tests passed.");
    } catch (err) {
        console.error("❌ Mongoose test failed:");
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log("7. Mongoose disconnected.");
    }
}

module.exports = connectDB;
module.exports = testConnection;
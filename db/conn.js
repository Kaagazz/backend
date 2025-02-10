require("dotenv").config(); // Ensure dotenv is loaded
const mongoose = require("mongoose");

const DB = process.env.DATABASE;

if (!DB) {
    console.error("Database URI is missing in environment variables.");
    process.exit(1);
}

mongoose.connect(DB)
    .then(() => console.log("✅ Database Connected"))
    .catch((error) => {
        console.error("❌ Database Connection Error:", error.message);
    });

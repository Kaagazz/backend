const users = require("../models/userSchema");
const userotp = require("../models/userOtp");
const nodemailer = require("nodemailer");

// Email configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// 📝 User Registration
exports.userregister = async (req, res) => {
    const { fname, email, password } = req.body;

    if (!fname || !email || !password) {
        return res.status(400).json({ error: "Please Enter All Input Data" });
    }

    try {
        const existingUser = await users.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: "This User Already Exists in Our DB" });
        }

        const userRegister = new users({ fname, email, password });

        // Save user with hashed password
        const savedUser = await userRegister.save();
        return res.status(200).json(savedUser);
    } catch (error) {
        return res.status(500).json({ error: "Invalid Details", details: error });
    }
};

// 📨 User Send OTP
exports.userOtpSend = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Please Enter Your Email" });
    }

    try {
        const existingUser = await users.findOne({ email });

        if (!existingUser) {
            return res.status(400).json({ error: "This User Does Not Exist in Our DB" });
        }

        // Generate a 6-digit OTP
        const OTP = Math.floor(100000 + Math.random() * 900000);

        // Check if OTP already exists for this email
        let otpData = await userotp.findOne({ email });

        if (otpData) {
            otpData.otp = OTP;
        } else {
            otpData = new userotp({ email, otp: OTP });
        }

        await otpData.save();

        // Email configuration
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Kaagaz Verification Code: Secure Your Account",
            text: `Dear User,

Thank you for choosing Kaagaz. To verify your identity and complete the authentication process, please use the following One-Time Password (OTP):

🔒 OTP: ${OTP}

This OTP is valid for the next 10 minutes. Please do not share it with anyone for security reasons.

If you did not request this verification, please ignore this email or contact our support team immediately.

Best Regards,  
Kaagaz Team`
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Email Error:", error);
                return res.status(500).json({ error: "Email Not Sent", details: error });
            }
            console.log("Email Sent:", info.response);
            return res.status(200).json({ message: "Email Sent Successfully" });
        });

    } catch (error) {
        return res.status(500).json({ error: "Invalid Details", details: error });
    }
};

// 🔐 User Login with OTP
exports.userLogin = async (req, res) => {
    const { email, otp } = req.body;

    if (!otp || !email) {
        return res.status(400).json({ error: "Please Enter Your OTP and Email" });
    }

    try {
        const otpVerification = await userotp.findOne({ email });

        if (!otpVerification || otpVerification.otp !== otp.toString()) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        const user = await users.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "User Not Found" });
        }

        // Generate JWT token
        const token = await user.generateAuthtoken();

        return res.status(200).json({ message: "User Login Successfully", userToken: token });

    } catch (error) {
        return res.status(500).json({ error: "Invalid Details", details: error });
    }
};

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { User, sequelize } = require('./src/User');
const { VerificationToken } = require('./src/VerificationToken');

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sync database
sequelize.sync();

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Signup API
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
    const token = crypto.randomBytes(32).toString('hex');

    await VerificationToken.create({
      token,
      userId: user.id,
      expiresAt: Date.now() + 3600000 // 1 hour expiration
    });

    const verificationLink = `http://localhost:${process.env.PORT}/verify?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: 'Email Verification',
      html: `<h1>Verify Your Email</h1><p>Click the link below to verify your email:</p><a href="${verificationLink}">Verify Email</a>`
    });

    res.status(200).send('Signup successful! Please check your email to verify your account.');
  } catch (error) {
    res.status(500).send('Error signing up. Please try again.');
  }
});

// Verify Email API
app.get('/verify', async (req, res) => {
  const { token } = req.query;

  try {
    const verificationToken = await VerificationToken.findOne({ where: { token } });

    if (!verificationToken || verificationToken.expiresAt < Date.now()) {
      return res.status(400).send('Token is invalid or expired.');
    }

    await User.update({ isVerified: true }, { where: { id: verificationToken.userId } });
    await VerificationToken.destroy({ where: { token } });

    res.status(200).send('Email verified successfully! You can now log in.');
  } catch (error) {
    res.status(500).send('Error verifying email. Please try again.');
  }
});

// Login API
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email, password } });

    if (!user) {
      return res.status(400).send('Invalid email or password.');
    }

    if (!user.isVerified) {
      return res.status(400).send('Please verify your email before logging in.');
    }

    res.status(200).send('Login successful!');
  } catch (error) {
    res.status(500).send('Error logging in. Please try again.');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

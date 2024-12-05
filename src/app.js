import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA1h1w5mZ6TsXjrvrNGYIn89KyVwL0sO9A",
    authDomain: "kmmtdb.firebaseapp.com",
    projectId: "kmmtdb",
    storageBucket: "kmmtdb.firebasestorage.app",
    messagingSenderId: "654043929614",
    appId: "1:654043929614:web:63f37234ebc850ed3c305f",
    measurementId: "G-SSHE1ERGQ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to show error message in floating box
function showError(message) {
    const errorBox = document.getElementById("error-box");
    errorBox.textContent = message;
    errorBox.style.display = "block";
    setTimeout(() => {
        errorBox.style.display = "none";
    }, 5000);
}

// Password strength checker function
function isStrongPassword(password) {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
}

// Signup function
async function signup(email, password, captchaInput) {
    const storedCaptcha = sessionStorage.getItem('captchaText');
    
    // Validate CAPTCHA
    if (captchaInput !== storedCaptcha) {
        showError("Incorrect CAPTCHA. Please try again.");
        return;
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
        showError("Password must be at least 8 characters long, contain a number, and a special character.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Signup successful: ", userCredential);

        // Send email verification to the user
        const user = userCredential.user;
        await sendEmailVerification(user);
        console.log("Email verification sent");

        alert("Signup successful! Please check your email to verify your account.");
        window.location.href = "login.html"; // Redirect to login after successful signup
    } catch (error) {
        console.error("Error during signup: ", error);
        showError("Error during signup: " + error.message);
    }
}

// Login function with attempt limiting and countdown
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 3 * 60 * 1000; // 3 minutes
let lockoutTimer = null;
let lockoutEndTime = parseInt(sessionStorage.getItem('lockoutEndTime')) || 0;
async function login(email, password) {
    const currentTime = new Date().getTime();
    const loginButton = document.getElementById('login-button'); // Assuming your login button has this ID

    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        if (currentTime < lockoutEndTime) {
            const remainingTime = Math.ceil((lockoutEndTime - currentTime) / 1000);
            showError(`Too many failed attempts. Please try again in ${remainingTime} seconds.`);
            loginButton.disabled = true; // Disable the login button during lockout
            return;
        } else {
            // Reset after lockout period has passed
            loginAttempts = 0;
            sessionStorage.removeItem('lockoutEndTime');
            loginButton.disabled = false; // Re-enable the login button
        }
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if the email is verified
        if (!user.emailVerified) {
            showError("Please verify your email address before logging in.");
            await auth.signOut(); // Sign out the user if they are not verified
            return;
        }

        console.log("Login successful: ", userCredential);
        alert("Login successful!");
        loginAttempts = 0; // Reset the failed attempts counter after a successful login
        
        // Navigate to home.html
        window.location.href = "home.html";
    } catch (error) {
        loginAttempts++;
        console.error("Error during login: ", error);
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            showError("Too many failed attempts. Please try again later.");
            lockoutEndTime = currentTime + LOCKOUT_TIME;
            sessionStorage.setItem('lockoutEndTime', lockoutEndTime); // Store lockout time in sessionStorage
            
            // Start countdown for lockout
            lockoutTimer = setInterval(() => {
                const remainingTime = Math.ceil((lockoutEndTime - new Date().getTime()) / 1000);
                if (remainingTime <= 0) {
                    clearInterval(lockoutTimer);
                    lockoutTimer = null;
                    loginAttempts = 0; // Reset attempts after lockout
                    sessionStorage.removeItem('lockoutEndTime');
                    loginButton.disabled = false; // Re-enable the login button
                }
                document.getElementById('lockout-timer').textContent = `Lockout time remaining: ${remainingTime} seconds`;
            }, 1000);
            loginButton.disabled = true; // Disable the login button during lockout
        } else {
            showError("Error during login: " + error.message);
        }
    }
}



// Handle Signup form submission
if (document.getElementById('signup-form')) {
    // Get the CAPTCHA and display it on page load
    fetch('/generate-captcha')
        .then(response => response.json())
        .then(data => {
            // Update CAPTCHA SVG
            document.getElementById('captcha-container').innerHTML = data.captchaSvg;
            sessionStorage.setItem('captchaText', data.captchaText); // Store CAPTCHA text
        });

    document.getElementById('signup-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const captchaInput = document.getElementById('captcha-input').value;

        signup(email, password, captchaInput);
    });
}

// Handle Login form submission
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        login(email, password);
    });
}



// Generate random CAPTCHA text
function generateCaptcha() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return captcha;
}

// Function to draw CAPTCHA text on the canvas with visual distortions
function drawCaptcha() {
    const captchaText = generateCaptcha();
    const canvas = document.getElementById('captcha-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

    // Clear the canvas for every new CAPTCHA
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas background color to white
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Define an array of possible font styles and colors with increased font size
    const fonts = ['35px Arial', '45px Comic Sans MS', '40px Georgia']; // Increased font sizes
    const colors = ['#000', '#FF0000', '#008000', '#0000FF', '#800080'];

    // Define positions to center the text vertically and horizontally
    const xStart = (canvas.width - 35 * captchaText.length) / 2; // Horizontally center text
    const yStart = (canvas.height + 15) / 2; // Vertically center text with a bit of padding

    // Draw the CAPTCHA text with random font styles, rotations, and colors
    for (let i = 0; i < captchaText.length; i++) {
        const font = fonts[Math.floor(Math.random() * fonts.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Set random styles
        ctx.font = font;
        ctx.fillStyle = color;

        // Random position and rotation
        const x = xStart + (i * 35); // 35 is the width of the font at 35px
        const y = yStart + Math.random() * 10 - 5; // Add slight vertical variation
        const rotation = Math.random() * 0.2 - 0.1; // Slight rotation for distortion

        // Save context, apply rotation, then draw the text
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillText(captchaText[i], 0, 0);
        ctx.restore();
    }

    // Store the CAPTCHA text in sessionStorage for validation
    sessionStorage.setItem('captchaText', captchaText);

    // Optionally: Add noise (lines or dots) to further distort the CAPTCHA
    addCaptchaNoise(ctx, canvas.width, canvas.height);
}}

// Function to add noise (lines or dots) to the canvas for added security
function addCaptchaNoise(ctx, width, height) {
    const noiseCount = 420;
    for (let i = 0; i < noiseCount; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;

        ctx.strokeStyle = "#ccc"; // light grey for noise
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

// On page load, generate and display CAPTCHA
window.onload = function() {
    drawCaptcha();
};

// Refresh CAPTCHA function on button click
document.addEventListener('DOMContentLoaded', function () {
    const regenButton = document.getElementById('regen-captcha');
    
    if (regenButton) {
        regenButton.addEventListener('click', () => {
            regenButton.classList.add('rotate');
            drawCaptcha(); // Assuming this function generates the new CAPTCHA image
            setTimeout(() => {
                regenButton.classList.remove('rotate');
            }, 300); // Remove rotation class after 300ms
        });
    } else {
        console.error("Regen button not found.");
    }
});




// Get elements from the Forgot Password page
const forgotPasswordForm = document.getElementById('forgot-password-form');
const emailInput = document.getElementById('forgot-email');
const errorBox = document.getElementById('error-box');

// Handle password reset form submission
forgotPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (email === "") {
        showError("Please enter your email address.");
        return;
    }
    
    try {
        // Sending password reset email using Firebase
        await sendPasswordResetEmail(auth, email);
        // Show success message
        showError("Password reset email sent! Please check your inbox.");
        errorBox.style.backgroundColor = "#ddffdd";  // Light green for success
        errorBox.style.color = "#008000";  // Dark green for success
    } catch (error) {
        let errorMessage = "An error occurred. Please try again.";
        if (error.code === "auth/user-not-found") {
            errorMessage = "No account found with this email address.";
        }
        showError(errorMessage);
        }
});

// --- CONFIGURATION ---

const EMAILJS_SERVICE_ID = 'service_gt148zp';  
const EMAILJS_TEMPLATE_ID = 'template_attk5n7';  
const EMAILJS_PUBLIC_KEY = 'ApUocJsnaaHnKXMx1'; 
emailjs.init(EMAILJS_PUBLIC_KEY);
const IMGBB_API_KEY = '11ed3bd6fecc8afcc51fbc36af89bf90'; 
// --- END CONFIGURATION ---

// --- 1. GLOBAL STATE AND ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const mainAppScreen = document.getElementById('main-app-screen');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const userEmailInput = document.getElementById('user-email');
const emergencyEmailInput = document.getElementById('emergency-contact-email');
const savedUserEmailDisplay = document.getElementById('saved-user-email');
const savedEmergencyEmailDisplay = document.getElementById('saved-emergency-email');
const statusMessage = document.getElementById('status-message');
const startButton = document.getElementById('start-listening');
const buttonText = document.getElementById('button-text');
const cancelButton = document.getElementById('cancel-alert');

let recognition = null; 
let watchId = null; 
let trackingTimeouts = []; // Array to hold 10 timeouts for email updates
let initialAlertSent = false; 
let currentMapLink = ""; // Stores the latest location link

// New variables for media functionality
let cameraStream = null; // To hold the media stream object
let isListening = false; // New flag to track listening state

// --- 2. LOGIN AND SETUP FUNCTIONS ---
function checkLoginStatus() {
    const savedUser = localStorage.getItem('userEmail');
    const savedEmergency = localStorage.getItem('emergencyEmail');

    if (savedUser && savedEmergency) {
        savedUserEmailDisplay.textContent = savedUser;
        savedEmergencyEmailDisplay.textContent = savedEmergency;
        loginScreen.classList.remove('active');
        mainAppScreen.classList.add('active');
        setTimeout(initializeVoiceRecognition, 500); 
    } else {
        mainAppScreen.classList.remove('active');
        loginScreen.classList.add('active');
    }
}

function handleLogin() {
    const userEmail = userEmailInput.value.trim();
    const emergencyEmail = emergencyEmailInput.value.trim();
    if (userEmail && emergencyEmail && userEmail.includes('@') && emergencyEmail.includes('@')) {
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('emergencyEmail', emergencyEmail);
        checkLoginStatus(); 
    } else {
        alert("Please enter both valid email addresses.");
    }
}

function handleLogout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('emergencyEmail');
    if (recognition) { recognition.stop(); }
    if (watchId) { navigator.geolocation.clearWatch(watchId); }
    stopCamera(); 
    clearAllTimeouts();
    
    userEmailInput.value = '';
    emergencyEmailInput.value = '';
    initialAlertSent = false;
    checkLoginStatus(); 
}

loginButton.addEventListener('click', handleLogin);
logoutButton.addEventListener('click', handleLogout);
window.addEventListener('load', checkLoginStatus);




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

// --- 3. VOICE RECOGNITION SETUP ---

function initializeVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        statusMessage.innerHTML = "<i class='fas fa-times-circle'></i> Error: Browser doesn't support Voice Recognition.";
        startButton.disabled = true;
        startButton.classList.remove('pulse');
        return;
    }
    
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = false;
    recognition.lang = 'en-US'; 

    startButton.addEventListener('click', () => {
        try {
            recognition.start();
        } catch (e) { }
    });

    recognition.onstart = function() {
        isListening = true;
        statusMessage.innerHTML = "<i class='fas fa-volume-up'></i> Listening: Say 'Help Me' or 'मदद करो' now...";
        statusMessage.className = 'status-box listening-status';
        startButton.classList.add('alert-mode');
        startButton.classList.remove('pulse');
        buttonText.textContent = 'LISTENING...';
        startButton.disabled = true; 
        cancelButton.classList.add('hidden');
    };

    recognition.onresult = function(event) {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

        if (transcript.includes('help me') || transcript.includes('madad karo')) {
            recognition.stop(); 
            statusMessage.innerHTML = "<i class='fas fa-bell'></i> KEYWORD DETECTED! Alerting in 3 seconds...";
            statusMessage.className = 'status-box alert-triggered';
            startButton.classList.remove('alert-mode');
            
            cancelButton.classList.remove('hidden');
            cancelButton.disabled = false;
            
            trackingTimeouts.push(setTimeout(triggerAlert, 3000)); 
        }
    };

    recognition.onerror = function(event) {
        isListening = false;
        resetUI(true); // Call resetUI with a flag to allow restart if not intentional
        if (event.error === 'not-allowed') {
             statusMessage.innerHTML = "<i class='fas fa-ban'></i> Microphone Permission Denied. Click 'Start Voice Alert' and grant access.";
        } else if (event.error === 'network') {
             statusMessage.innerHTML = "<i class='fas fa-wifi'></i> Network error. Please check your connection.";
        }
    };
    
    recognition.onend = function() {
        isListening = false;
        // Automatically restart listening if the app hasn't been cancelled/triggered an alert
        if (!cancelButton.classList.contains('alert-mode-active')) {
             setTimeout(() => {
                 try { recognition.start(); } catch (e) { resetUI(); }
             }, 1000); 
        }
    };
    
    try {
        recognition.start();
    } catch (e) { }
}

function resetUI() {
    startButton.disabled = false;
    startButton.classList.add('pulse');
    startButton.classList.remove('alert-mode');
    buttonText.textContent = 'START VOICE ALERT';
    statusMessage.className = 'status-box default-status';
    statusMessage.innerHTML = "<i class='fas fa-microphone-slash'></i> Press 'Start' to begin listening...";
    cancelButton.classList.add('hidden');
    cancelButton.classList.remove('alert-mode-active');
}

function clearAllTimeouts() {
    trackingTimeouts.forEach(timerId => clearTimeout(timerId));
    trackingTimeouts = [];
}





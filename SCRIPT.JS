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



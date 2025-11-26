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
// --- 4. CAMERA & MEDIA LOGIC ---

function initializeCamera() {
    const video = document.getElementById('camera-feed');
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
            cameraStream = stream;
            video.srcObject = stream;
            video.play();
            statusMessage.innerHTML += "<br><i class='fas fa-video'></i> Camera stream started (hidden).";
        })
        .catch(err => {
            console.error("Camera access failed:", err);
            // This is important: The status message should not be overwritten by the location update, so we use string concatenation
            // statusMessage.innerHTML += `<br><i class='fas fa-camera-slash'></i> Camera access failed: ${err.name}. Sending location only.`;
        });
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}
// --- 5. 10-MINUTE LOCATION AND ALERT LOGIC ---

function triggerAlert() {
    statusMessage.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Alert triggered. Requesting Location & Camera Access...";
    
    cancelButton.classList.add('alert-mode-active');
    cancelButton.classList.remove('hidden');
    
    startLiveLocationTracking();
}

function startLiveLocationTracking() {
    if (!navigator.geolocation) {
        statusMessage.innerHTML = "<i class='fas fa-times-circle'></i> Geolocation is not supported by this browser.";
        return;
    }
    
    const ONE_MINUTE = 60 * 1000;

    // 1. Initialize Camera 
    initializeCamera();
    
    // 2. Start Watch Position (Updates the 'currentMapLink' variable continuously)
    watchId = navigator.geolocation.watchPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Corrected Google Maps search API format (Ensuring the URL is valid)
        currentMapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        
        // Update status with the latest location on the user's screen
        statusMessage.innerHTML = `
            <span style="font-weight: bold;"><i class='fas fa-location-arrow'></i> ALERT ACTIVE: Live Tracking</span><br>
            Latest Location: <a href="${currentMapLink}" target="_blank" style="color: var(--text-light); text-decoration: underline;">VIEW LIVE MAP</a>
            <p style="font-size: 0.8em; margin: 0;">L/L: ${lat.toFixed(5)}, ${lon.toFixed(5)}</p>
        `;

        if (!initialAlertSent) {
             // Send immediate email (0 min)
             captureFrameAndSend("0 min (Initial)", 0); 
             initialAlertSent = true;
        }

    }, (error) => {
        statusMessage.innerHTML = `<i class='fas fa-exclamation-triangle'></i> Location Error: ${error.message}. Tracking interrupted.`;
    }, {
        enableHighAccuracy: true,
        timeout: 10000, 
        maximumAge: 0
    });

    // 3. Schedule 9 more updates (1 minute to 9 minutes)
    for (let i = 1; i <= 9; i++) {
        const delay = i * ONE_MINUTE;
        const type = `${i} min Update`;
        
        const timerId = setTimeout(() => {
            if (watchId) {
                 // Send location update AND captured frame
                 captureFrameAndSend(type, i); 
            }
        }, delay);
        trackingTimeouts.push(timerId);
    }
}
     // 4. Schedule final update and stop after 10 minutes
    const finalTimerId = setTimeout(() => {
        if(watchId) {
             captureFrameAndSend("10 min (Final)", 10); // Send final email
             navigator.geolocation.clearWatch(watchId);
             watchId = null;
        }
        statusMessage.innerHTML = "<i class='fas fa-clock'></i> 10-Minute Live Tracking period has ended. Resetting app.";
        cancelAlert(); // Reset UI after 10 minutes
    }, 10 * ONE_MINUTE);
    trackingTimeouts.push(finalTimerId);


function cancelAlert() {
    clearAllTimeouts(); 
    
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    stopCamera(); // Stop the camera stream 
    
    if (recognition && isListening) { // Only call stop if it's currently listening
        recognition.stop();
    }
    
    initialAlertSent = false; 
    currentMapLink = "";
    resetUI(); 
}

cancelButton.addEventListener('click', cancelAlert);

// --- 6. IMAGE UPLOAD & EMAIL SEND (IMGBB FREE SOLUTION) ---

async function uploadToImgBB(base64Data, type) {
    if (!base64Data || base64Data === 'No Photo Captured.') {
        return "No Photo Captured.";
    }

    // ImgBB API requires the Base64 string without the 'data:image/jpeg;base64,' prefix.
    const imgData = base64Data.split(',')[1]; 

    statusMessage.innerHTML += `<br><i class='fas fa-cloud-upload-alt'></i> Uploading **${type}** image to ImgBB...`;
    
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY); // The required API Key
    formData.append('image', imgData);      // The Base64 image data (without prefix)
    formData.append('name', `${type.replace(/ /g, '_')}_Photo`); // Sets the image filename

    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`ImgBB upload failed: ${response.statusText}`);
        }

        const jsonResponse = await response.json();
        
        if (jsonResponse.success && jsonResponse.data.url) {
            statusMessage.innerHTML += `<br><i class='fas fa-link'></i> Image link received.`;
            return jsonResponse.data.url; // The short, permanent link
        } else {
            throw new Error(`ImgBB failed to return a valid URL. Response: ${JSON.stringify(jsonResponse)}`);
        }
    } catch (error) {
        console.error("ImgBB Upload Error:", error);
        statusMessage.innerHTML += `<br><i class='fas fa-exclamation-triangle'></i> ImgBB upload failed! Sending location only.`;
        return "UPLOAD FAILED. Check console for error.";
    }
}

async function captureFrameAndSend(type, minute) {
    if (!currentMapLink) {
        sendEmail({ 
            location_link: "Location not available.", image_link: "No location available." 
        }, type, "Location not available.");
        return;
    }
    
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('photo-canvas');
    const context = canvas.getContext('2d');
    
    let base64Data = 'No Photo Captured.';
    
    if (video.srcObject && video.readyState === 4) {
        canvas.width = 320; 
        canvas.height = 240;
        context.drawImage(video, 0, 0, 320, 240);
        base64Data = canvas.toDataURL('image/jpeg', 0.6); 
    }
    
    // 1. Upload the captured image and wait for the short URL
    const shortImageLink = await uploadToImgBB(base64Data, type);

    // 2. Send the email with the new parameter (image_link)
    const templateParams = {
        to_email: localStorage.getItem('emergencyEmail'), 
        user_email: localStorage.getItem('userEmail'), 
        location_link: currentMapLink,
        alert_type: type,
        minutes_passed: minute,
        image_link: shortImageLink, // The short, working link
    };

    sendEmail(templateParams, type, currentMapLink);
}


function sendEmail(templateParams, type, locationLink) {
    const recipientEmail = templateParams.to_email;

    statusMessage.innerHTML = `<i class='fas fa-envelope-open-text'></i> Sending **${type}** update (with short image link) to ${recipientEmail}...`;

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then((response) => {
            statusMessage.innerHTML = `
                <span style="font-weight: bold;"><i class='fas fa-check-circle'></i> SUCCESS! ${type} Alert Sent.</span><br>
                <a href="${locationLink}" target="_blank" style="color: var(--text-light); text-decoration: underline;">TRACK LOCATION NOW</a>
            `;
            statusMessage.className = 'status-box alert-triggered';
        }, (error) => {
            statusMessage.innerHTML = `
                <span style="font-weight: bold; color: yellow;"><i class='fas fa-exclamation-circle'></i> FAILED TO SEND ${type} EMAIL!</span><br>
                <p style="margin-top: 5px;">Error: ${error.text || error}. Live tracking continues.</p>
                <a href="${locationLink}" target="_blank" style="color: var(--text-light); text-decoration: underline;">VIEW LOCATION LINK (Fallback)</a>
            `;
            statusMessage.className = 'status-box alert-triggered';
        });
}







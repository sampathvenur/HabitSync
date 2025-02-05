chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script running...");
});

let timerMinutes = 25;
let timerSeconds = 0;
let timerRunning = false;
let timerInterval;

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startTimer") {
        timerMinutes = message.minutes;
        timerSeconds = 0;
        timerRunning = true;
        startBackgroundTimer();
    } else if (message.action === "pauseTimer") {
        timerRunning = false;
        clearInterval(timerInterval);
    } else if (message.action === "resumeTimer") {
        timerRunning = true;
        startBackgroundTimer();
    } else if (message.action === "resetTimer") {
        timerRunning = false;
        timerMinutes = message.minutes;
        timerSeconds = 0;
        clearInterval(timerInterval);
    }
});

// Function to keep timer running in background
function startBackgroundTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerMinutes === 0 && timerSeconds === 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            showNotification();
            return;
        }

        if (timerSeconds === 0) {
            timerMinutes--;
            timerSeconds = 59;
        } else {
            timerSeconds--;
        }

        // Save timer state so popup can restore it
        chrome.storage.sync.set({
            pomodoro: {
                minutes: timerMinutes,
                seconds: timerSeconds,
                running: timerRunning,
            },
        });

        // Send real-time updates to popup.js
        chrome.runtime.sendMessage({
            action: "updateTimer",
            minutes: timerMinutes,
            seconds: timerSeconds,
            running: timerRunning
        }, function (response) {
            if (chrome.runtime.lastError) {
                console.warn("No receiver for message (Popup might be closed)");
            }
        });

    }, 1000);
}

// Show notification when Pomodoro ends
function showNotification() {
    chrome.notifications.create("", {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Pomodoro Completed!",
        message: "Time's up! Take a break.",
        priority: 2
    }, function (notificationId) {
        if (chrome.runtime.lastError) {
            console.error("Notification Error:", chrome.runtime.lastError);
        }
    });
}
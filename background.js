let DEFAULT_DURATION = 25 * 60; // 25 minutes default

// Initialize timer state when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    timeLeft: DEFAULT_DURATION,
    duration: DEFAULT_DURATION,
    isRunning: false
  });
  // Set default icon when the extension is installed or reset
  chrome.action.setIcon({ path: 'assets/icon16.png' });
});

// Listen for messages sent from popup to control the timer
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_TIMER':
      startTimer(message.duration);
      break;
    case 'STOP_TIMER':
      stopTimer();
      break;
    case 'RESET_TIMER':
      resetTimer();
      break;
    case 'SET_DURATION':
      setDuration(message.duration);
      break;
  }
});

function setDuration(duration) {
  DEFAULT_DURATION = duration;
  chrome.storage.local.set({
    duration: duration,
    timeLeft: duration,
  });
  updateIcon(); // Update the icon when the duration is set
}

function startTimer(duration) {
  // Clear any existing timer
  stopTimer();
  
  // Set initial state with provided duration or default
  const timerDuration = duration || DEFAULT_DURATION;
  chrome.storage.local.set({
    isRunning: true,
    timeLeft: timerDuration,
    duration: timerDuration
  });

  // Create an alarm that fires every second (period: 1 second)
  chrome.alarms.create('timerTick', {
    periodInMinutes: 1 / 60  // Trigger every 1 second
  });
}

function stopTimer() {
  chrome.alarms.clear('timerTick');
  chrome.storage.local.set({ isRunning: false });
  updateIcon(); // Update the icon when the timer is stopped
}

function resetTimer() {
  stopTimer();
  chrome.storage.local.get(['duration'], (result) => {
    const duration = result.duration || DEFAULT_DURATION;
    chrome.storage.local.set({
      timeLeft: duration,
      duration: duration,
      isRunning: false
    });
    updateIcon(); // Update the icon when the timer is reset
  });
}

// Handle timer ticks (triggered every second)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'timerTick') {
    const state = await chrome.storage.local.get(['timeLeft', 'isRunning']);
    
    if (state.isRunning && state.timeLeft > 0) {
      const newTimeLeft = state.timeLeft - 1;
      await chrome.storage.local.set({ timeLeft: newTimeLeft });
      updateIcon(); // Update the icon with the new time

      if (newTimeLeft <= 0) {
        stopTimer();
        showNotification();
      }
    }
  }
});

// Show a desktop notification when the timer finishes
function showNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/notificationIcon.png',
    title: 'Time for a break!',
    message: 'Your productivity session is complete. Take a short break!',
    priority: 2,
    requireInteraction: true
  });
}

// Update the extension icon with the remaining time
function updateIcon() {
  chrome.storage.local.get(['timeLeft', 'isRunning'], (state) => {
    const timeLeft = state.timeLeft || DEFAULT_DURATION;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const canvas = new OffscreenCanvas(48, 48);  
    const context = canvas.getContext('2d');

    context.beginPath();
    context.arc(24, 24, 24, 0, Math.PI * 2, false);
    context.fillStyle = state.isRunning ? '#4CAF50' : '#808080';
    context.fill();

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 18px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(timeString, 24, 24); 

    // Set the icon from the canvas
    chrome.action.setIcon({ imageData: context.getImageData(0, 0, 48, 48) });
    if (!state.isRunning) {
      chrome.action.setIcon({ path: 'assets/icon16.png' });
    }
  });
}

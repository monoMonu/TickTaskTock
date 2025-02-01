document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const timerDisplay = document.getElementById('timer');
  const timerInput = document.getElementById('timerInput');
  const saveBtn = document.getElementById('saveBtn');

  // Load saved duration
  chrome.storage.local.get(['duration', 'timeLeft', 'isRunning'], (result) => {
    if(!result.isRunning) {
      startBtn.textContent = 'Start';
    }
    if (result.duration) {
      timerInput.value = Math.floor(result.duration / 60);
    }
  });

  // Update display initially and start periodic updates
  updateDisplay();
  setInterval(updateDisplay, 1000);

  saveBtn.addEventListener('click', () => {
    const minutes = parseInt(timerInput.value) || 25;
    const duration = minutes * 60;
    chrome.storage.local.set({ duration });
    chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
    chrome.runtime.sendMessage({ 
      type: 'SET_DURATION', 
      duration 
    });
    startBtn.textContent = 'Start';
  });

  startBtn.addEventListener('click', () => {
    if(startBtn.textContent === 'Start') {
      const minutes = parseInt(timerInput.value) || 25;
      chrome.runtime.sendMessage({ 
        type: 'START_TIMER',
        duration: minutes * 60
      });
      startBtn.textContent = 'Pause';
    } else {
      chrome.runtime.sendMessage({ type: 'STOP_TIMER' });
      startBtn.textContent = 'Start';
    }
  });

  resetBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'RESET_TIMER' });
  });

  async function updateDisplay() {
    const state = await chrome.storage.local.get(['timeLeft', 'isRunning', 'duration']);
    const timeLeft = state.timeLeft || state.duration || 25 * 60;
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
});
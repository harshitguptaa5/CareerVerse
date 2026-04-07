// CareerVerse Global State Manager & Gamification System
const CareerState = {
  getProfile: function() {
    let profile = localStorage.getItem('careerVerseProfile');
    if (!profile) {
      profile = {
        name: 'Guest User',
        doctor: { completed: false, score: 0, time: 0 },
        pilot: { completed: false, score: 0, time: 0 },
        software: { completed: false, score: 0, time: 0 },
        totalScore: 0
      };
      localStorage.setItem('careerVerseProfile', JSON.stringify(profile));
    } else {
      profile = JSON.parse(profile);
    }
    return profile;
  },
  
  saveProfile: function(profile) {
    localStorage.setItem('careerVerseProfile', JSON.stringify(profile));
  },
  
  updateScore: function(career, points) {
    let profile = this.getProfile();
    profile[career].score += points;
    profile[career].completed = true;
    profile.totalScore += points;
    this.saveProfile(profile);
  }
};

// AI Voice Assistant (Web Speech API)
const AIVoice = {
  speak: function(text) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech to avoid overlap
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.1; // Slightly futuristic/friendly
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      console.log("SpeechSynthesis not supported");
    }
  }
};

// Multi-step Task Logic Component
AFRAME.registerComponent('multi-step-task', {
  schema: {
    career: { type: 'string', default: 'doctor' },
    stepOrder: { type: 'number', default: 1 },
    taskName: { type: 'string', default: 'Task' },
    successMessage: { type: 'string', default: 'Done!' },
    points: { type: 'number', default: 10 }
  },

  init: function () {
    const el = this.el;
    const data = this.data;
    
    // Original style preservation
    this.originalColor = el.getAttribute('color') || '#FFFFFF';
    this.isCompleted = false;

    // We store the current step on the scene element to track global progress
    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl.hasAttribute('data-current-step')) {
      sceneEl.setAttribute('data-current-step', 1);
    }

    el.addEventListener('mouseenter', () => {
      if (!this.isCompleted) el.setAttribute('scale', '1.1 1.1 1.1');
    });
    el.addEventListener('mouseleave', () => {
      if (!this.isCompleted) el.setAttribute('scale', '1 1 1');
    });

    el.addEventListener('click', () => {
      if (this.isCompleted) return;

      let currentStep = parseInt(sceneEl.getAttribute('data-current-step'));

      const feedbackText = document.querySelector('#feedbackText');
      const scoreDisplay = document.querySelector('#scoreDisplay');

      if (currentStep === data.stepOrder) {
        // Correct step!
        this.isCompleted = true;
        el.setAttribute('color', '#00FF00'); // Green for good
        
        // Update gamification
        CareerState.updateScore(data.career, data.points);
        let profile = CareerState.getProfile();
        if(scoreDisplay) scoreDisplay.setAttribute('value', 'Score: ' + profile[data.career].score);
        
        // Update progression
        sceneEl.setAttribute('data-current-step', currentStep + 1);
        
        // Voice and Text Feedback
        if(feedbackText) feedbackText.setAttribute('value', data.successMessage);
        AIVoice.speak(data.successMessage);

        // Check if level is complete (Assuming 3 steps per level for now)
        if (currentStep >= 3) {
           setTimeout(() => {
             AIVoice.speak("Simulation complete. Excellent work. You may return to the hub.");
             if(feedbackText) feedbackText.setAttribute('value', 'SIMULATION COMPLETE! +30 XP');
             const returnButton = document.querySelector('#returnButton');
             if (returnButton) {
               returnButton.setAttribute('visible', 'true');
               returnButton.classList.add('clickable');
             }
           }, 2000);
        }
      } else if (currentStep < data.stepOrder) {
        // Wrong order
        el.setAttribute('color', '#FF0000'); // Red error flash
        setTimeout(() => el.setAttribute('color', this.originalColor), 500);
        
        const errorMsg = "Error: Sequence incorrect. You must complete the previous tasks first.";
        if(feedbackText) feedbackText.setAttribute('value', errorMsg);
        AIVoice.speak(errorMsg);
        
        // Penalize score for mistake
        CareerState.updateScore(data.career, -2); 
      }
    });
  }
});

// A component to handle returning to hub
AFRAME.registerComponent('return-to-hub', {
  init: function () {
    this.el.addEventListener('click', function () {
      window.location.href = 'index.html';
    });
  }
});

// Auto-greeting when scene loads
AFRAME.registerComponent('scene-greeting', {
  schema: { message: { type: 'string', default: 'Welcome.' } },
  init: function () {
    // Slight delay to ensure audio context is ready (some browsers require user interaction though)
    // In VR environments, mouse-enter or click usually enables audio context context.
    // For automatic audio, we might need a distinct user click first, but we will try this.
    setTimeout(() => {
      AIVoice.speak(this.data.message);
    }, 1000);
  }
});

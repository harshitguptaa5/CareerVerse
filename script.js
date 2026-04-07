// Global State
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

// AI Voice/Character Dialogue System
const Dialogue = {
  speak: function(text, pitch = 1.0, rate = 1.0) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  }
};

// Cinematic Story Manager
AFRAME.registerComponent('story-manager', {
  schema: {
    career: { type: 'string', default: 'doctor' },
    introDialogue: { type: 'string', default: 'Begin.' },
    timeLimit: { type: 'number', default: 60 },
    climaxPrompt: { type: 'string', default: 'Critical Decision!' },
    goodChoice: { type: 'string', default: 'Action A' },
    badChoice: { type: 'string', default: 'Action B' }
  },

  init: function () {
    this.timer = this.data.timeLimit;
    this.timerRunning = false;
    this.climaxTriggered = false;

    // Start Intro after 2 seconds
    setTimeout(() => {
      Dialogue.speak(this.data.introDialogue, 1.2, 1.1); // Slightly faster for urgency
      this.timerRunning = true;
      
      const feedbackText = document.querySelector('#feedbackText');
      if(feedbackText) {
          feedbackText.setAttribute('value', 'URGENT: Complete tasks before time runs out!');
          feedbackText.setAttribute('color', '#FF0000');
      }
    }, 2000);

    // Timer Loop
    this.tickInterval = setInterval(() => {
      if (this.timerRunning && !this.climaxTriggered) {
        this.timer--;
        
        const timerUI = document.querySelector('#timerDisplay');
        if (timerUI) timerUI.setAttribute('value', 'T-' + this.timer + 's');

        if (this.timer <= 0) {
          this.timerRunning = false;
          this.triggerFailure("Time ran out. The situation was lost.");
        }
      }
    }, 1000);
  },

  checkProgression: function() {
    const sceneEl = document.querySelector('a-scene');
    let tasksDone = parseInt(sceneEl.getAttribute('data-tasks-done'));
    if (tasksDone >= 3 && !this.climaxTriggered) {
      this.triggerClimax();
    }
  },

  triggerClimax: function() {
    this.climaxTriggered = true;
    this.timerRunning = false; // Pause timer for climax

    // Dim the lights
    const sky = document.querySelector('a-sky');
    if (sky) sky.setAttribute('color', '#220000'); // Red tint

    Dialogue.speak("Critical Warning! " + this.data.climaxPrompt, 0.8, 1.2);
    
    // Show climax UI
    const climaxUI = document.querySelector('#climaxUI');
    if (climaxUI) {
      climaxUI.setAttribute('visible', 'true');
      climaxUI.setAttribute('position', '0 1.5 -1.5'); // Bring to front
    }
  },

  triggerFailure: function(reason) {
    Dialogue.speak(reason, 0.5, 0.8);
    CareerState.updateScore(this.data.career, -50);
    setTimeout(() => { window.location.href = 'analytics.html'; }, 4000);
  },

  resolveClimax: function(success) {
    const climaxUI = document.querySelector('#climaxUI');
    if (climaxUI) climaxUI.setAttribute('visible', 'false');

    if (success) {
      Dialogue.speak("Crisis averted. Excellent work under pressure. Simulation ended.", 1.0, 1.0);
      CareerState.updateScore(this.data.career, 100 + this.timer); // Bonus points for remaining time
      
      const sky = document.querySelector('a-sky');
      if (sky) sky.setAttribute('color', '#004400'); // Green tint for success
      
      setTimeout(() => {
        const returnButton = document.querySelector('#returnButton');
        if (returnButton) {
          returnButton.setAttribute('visible', 'true');
          returnButton.classList.add('clickable');
        }
      }, 3000);
    } else {
      this.triggerFailure("Critical Failure. Wrong decision made.");
    }
  }
});

// Climax Choice Button
AFRAME.registerComponent('climax-choice', {
  schema: { isGoodChoice: { type: 'boolean', default: true } },
  init: function () {
    this.el.addEventListener('click', () => {
      const storyManager = document.querySelector('a-scene').components['story-manager'];
      if(storyManager) storyManager.resolveClimax(this.data.isGoodChoice);
    });
    this.el.addEventListener('mouseenter', () => this.el.setAttribute('scale', '1.1 1.1 1.1'));
    this.el.addEventListener('mouseleave', () => this.el.setAttribute('scale', '1 1 1'));
  }
});

// Interactive Story Object
AFRAME.registerComponent('story-task', {
  schema: { 
    taskName: { type: 'string', default: 'Task' },
    guideStep: { type: 'string', default: 'Completed step' }
  },
  init: function () {
    this.isCompleted = false;
    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl.hasAttribute('data-tasks-done')) sceneEl.setAttribute('data-tasks-done', 0);

    this.el.addEventListener('mouseenter', () => { if (!this.isCompleted) this.el.setAttribute('scale', '1.1 1.1 1.1'); });
    this.el.addEventListener('mouseleave', () => { if (!this.isCompleted) this.el.setAttribute('scale', '1 1 1'); });

    this.el.addEventListener('click', () => {
      if (this.isCompleted) return;
      this.isCompleted = true;
      this.el.setAttribute('color', '#00FF00'); 
      
      let tasksDone = parseInt(sceneEl.getAttribute('data-tasks-done')) + 1;
      sceneEl.setAttribute('data-tasks-done', tasksDone);
      
      Dialogue.speak(this.data.taskName + " logged.");
      
      // Update dynamic HUD
      const guideText = document.querySelector('#guideText');
      if (guideText) {
          let currentText = guideText.getAttribute('value');
          // Add a checkmark and the completed step to the UI Guide
          guideText.setAttribute('value', currentText + '\n[X] ' + this.data.guideStep);
      }
      
      const storyManager = sceneEl.components['story-manager'];
      if (storyManager) storyManager.checkProgression();
    });
  }
});

// Return to hub
AFRAME.registerComponent('return-to-hub', {
  init: function () {
    this.el.addEventListener('click', function () { window.location.href = 'index.html'; });
  }
});

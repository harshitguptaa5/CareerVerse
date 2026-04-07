// Register custom A-Frame component for interactable career tasks
AFRAME.registerComponent('interactable-task', {
  schema: {
    taskName: { type: 'string', default: 'Task' },
    targetColor: { type: 'string', default: '#00FF00' } // Green for success
  },

  init: function () {
    const el = this.el;
    const data = this.data;
    
    // Store original color
    const originalColor = el.getAttribute('color') || '#FFFFFF';
    this.originalColor = originalColor;
    
    this.isCompleted = false;

    // Hover effects
    el.addEventListener('mouseenter', () => {
      if (!this.isCompleted) {
        el.setAttribute('scale', '1.1 1.1 1.1');
      }
    });

    el.addEventListener('mouseleave', () => {
      if (!this.isCompleted) {
        el.setAttribute('scale', '1 1 1');
      }
    });

    // Click logic
    el.addEventListener('click', () => {
      if (this.isCompleted) return;
      
      this.isCompleted = true;
      el.setAttribute('color', data.targetColor);
      
      // Look for the feedback text entity in the scene
      const feedbackText = document.querySelector('#feedbackText');
      if (feedbackText) {
        feedbackText.setAttribute('value', 'Success: ' + data.taskName + ' completed!');
      }

      // Look for the return button to show it
      const returnButton = document.querySelector('#returnButton');
      if (returnButton) {
        returnButton.setAttribute('visible', 'true');
        returnButton.classList.add('clickable'); // Make it interactive
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

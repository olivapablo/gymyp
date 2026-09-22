// Web Audio API Synthesized Audio Engine for FITTRACK
window.FITTRACK = window.FITTRACK || {};

(function() {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.FITTRACK.audio = {
    // Short tick for countdown (5, 4, 3, 2, 1)
    playCountdownTick(freq = 600, duration = 0.08) {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    },

    // Energetic start sound on ¡YA! / Go!
    playStartGoSound() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = ctx.currentTime + idx * 0.06;
          const duration = 0.4;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      } catch (e) {}
    },

    // Rest countdown tick (final 5, 4, 3, 2, 1 seconds)
    playRestWarningTick(secondsRemaining) {
      const freq = secondsRemaining === 1 ? 880 : 587.33;
      this.playCountdownTick(freq, 0.1);
    },

    // Rest completed chime
    playRestFinishedSound() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const chord = [659.25, 880, 1046.50]; // E5, A5, C6
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const duration = 0.45;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + duration);
        });
      } catch (e) {}
    },

    // Workout finished celebratory chime
    playFinishWorkoutSound() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const fanfare = [
          { freq: 523.25, time: 0 },
          { freq: 659.25, time: 0.12 },
          { freq: 783.99, time: 0.24 },
          { freq: 1046.50, time: 0.38 }
        ];
        fanfare.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = ctx.currentTime + note.time;
          const duration = 0.6;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, startTime);

          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      } catch (e) {}
    }
  };
})();

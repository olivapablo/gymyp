// Web Audio API Synthesized Audio Engine for FITTRACK
// High-volume, punchy synthesizer designed to cut through background music clearly
window.FITTRACK = window.FITTRACK || {};

(function() {
  let audioCtx = null;
  let masterCompressor = null;
  let masterGain = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();

        // Dynamics Compressor to maximize perceived loudness without harsh digital distortion
        masterCompressor = audioCtx.createDynamicsCompressor();
        masterCompressor.threshold.setValueAtTime(-10, audioCtx.currentTime);
        masterCompressor.knee.setValueAtTime(8, audioCtx.currentTime);
        masterCompressor.ratio.setValueAtTime(6, audioCtx.currentTime);
        masterCompressor.attack.setValueAtTime(0.002, audioCtx.currentTime);
        masterCompressor.release.setValueAtTime(0.12, audioCtx.currentTime);

        // High-output master gain booster
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(1.15, audioCtx.currentTime);

        masterCompressor.connect(masterGain);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function getDestination(ctx) {
    return masterCompressor || ctx.destination;
  }

  // Helper for realistic metallic boxing bell strike
  function playBellStrike(ctx, startTime, gainLevel = 0.85) {
    // Fundamental + resonant metallic inharmonics
    const harmonics = [
      { freq: 850, type: 'sine', gain: 0.75, decay: 0.85 },
      { freq: 1260, type: 'triangle', gain: 0.55, decay: 0.65 },
      { freq: 1780, type: 'triangle', gain: 0.40, decay: 0.50 },
      { freq: 2820, type: 'sine', gain: 0.28, decay: 0.35 },
      { freq: 4180, type: 'sine', gain: 0.18, decay: 0.20 }
    ];

    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = h.type;
      osc.frequency.setValueAtTime(h.freq, startTime);

      const targetGain = h.gain * gainLevel;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(targetGain, startTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + h.decay);

      osc.connect(gain);
      gain.connect(getDestination(ctx));

      osc.start(startTime);
      osc.stop(startTime + h.decay);
    });
  }

  window.FITTRACK.audio = {
    // Loud, punchy tick for countdown (5, 4, 3, 2, 1)
    playCountdownTick(freq = 750, duration = 0.12) {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Triangle wave cuts through background music much better than sine
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.85, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(getDestination(ctx));

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        console.warn('Audio tick error:', e);
      }
    },

    // Authentic Double Boxing Bell ("DING! ... DING!")
    playBoxingBell() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // Strike 1
        playBellStrike(ctx, now, 0.85);
        // Strike 2 (280ms later)
        playBellStrike(ctx, now + 0.28, 0.95);
      } catch (e) {
        console.warn('Boxing bell audio error:', e);
      }
    },

    // Realistic Sports Referee / Coach Whistle with pea flutter
    playWhistle(duration = 0.42) {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // LFO for the spinning pea flutter vibration (~28Hz)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(28, now);
        lfoGain.gain.setValueAtTime(90, now); // frequency modulation depth

        // Whistle Tone 1 (Primary high pitch)
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(2450, now);

        // Whistle Tone 2 (Harmonic high pitch)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2820, now);

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        // Master whistle gain envelope with sharp athletic attack
        const whistleGain = ctx.createGain();
        whistleGain.gain.setValueAtTime(0.001, now);
        whistleGain.gain.linearRampToValueAtTime(0.9, now + 0.02);
        whistleGain.gain.setValueAtTime(0.9, now + duration - 0.06);
        whistleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.connect(whistleGain);
        osc2.connect(whistleGain);
        whistleGain.connect(getDestination(ctx));

        lfo.start(now);
        osc1.start(now);
        osc2.start(now);

        lfo.stop(now + duration);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
      } catch (e) {
        console.warn('Whistle audio error:', e);
      }
    },

    // Energetic Start Sound on "¡YA!" / Go!
    playStartGoSound() {
      // Play double boxing bell on start
      this.playBoxingBell();
    },

    // Warning ticks in last 5 seconds of rest
    playRestWarningTick(secondsRemaining) {
      const freq = secondsRemaining === 1 ? 1100 : 750;
      this.playCountdownTick(freq, 0.12);
    },

    // Rest started: Sports whistle signal to begin recovery
    playRestStartSound() {
      try {
        this.playWhistle(0.42);
      } catch (e) {
        console.warn('Rest start audio error:', e);
      }
    },

    // Rest finished: Double boxing bell signal to return to work ("DING! ... DING!")
    playRestFinishedSound() {
      try {
        this.playBoxingBell();
      } catch (e) {
        console.warn('Rest finished audio error:', e);
      }
    },

    // Workout finished celebratory victory fanfare
    playFinishWorkoutSound() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const fanfare = [
          { freq: 523.25, time: 0 },
          { freq: 659.25, time: 0.12 },
          { freq: 783.99, time: 0.24 },
          { freq: 1046.50, time: 0.38 }
        ];
        fanfare.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + note.time;
          const duration = 0.65;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.75, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(gain);
          gain.connect(getDestination(ctx));

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      } catch (e) {
        console.warn('Finish audio error:', e);
      }
    }
  };
})();

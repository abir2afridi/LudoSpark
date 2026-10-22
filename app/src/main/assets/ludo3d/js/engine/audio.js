/**
 * High-quality procedural sound synthesizer & Background Music (BGM) engine using Web Audio API.
 * Completely self-contained: works offline with independent SFX & BGM Volume Controls.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmEnabled = true;

    // Independent Volume Sliders [0.0 .. 1.0]
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    this.sfxVolume = parseFloat((ls && ls.getItem('ludoSpark.sfxVol')) || '0.8');
    this.bgmVolume = parseFloat((ls && ls.getItem('ludoSpark.bgmVol')) || '0.5');

    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    try { localStorage.setItem('ludoSpark.sfxVol', this.sfxVolume); } catch (e) {}
  }

  setBGMVolume(val) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    try { localStorage.setItem('ludoSpark.bgmVol', this.bgmVolume); } catch (e) {}
  }

  // ---- Background Music Loop (Procedural Melody) ----
  startBGM() {
    this.init();
    if (this.bgmTimer) return;

    const melody = [
      [261.63, 329.63, 392.00], // C
      [293.66, 349.23, 440.00], // Dm
      [329.63, 392.00, 493.88], // Em
      [349.23, 440.00, 523.25], // F
      [392.00, 493.88, 587.33], // G
      [440.00, 523.25, 659.25], // Am
      [349.23, 440.00, 523.25], // F
      [392.00, 493.88, 587.33]  // G
    ];

    this.bgmTimer = setInterval(() => {
      if (!this.enabled || !this.bgmEnabled || !this.ctx || this.bgmVolume <= 0.01) return;
      try {
        const t = this.ctx.currentTime;
        const chord = melody[this.bgmStep % melody.length];
        this.bgmStep++;

        chord.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = i === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq * 0.5, t);

          const vol = 0.05 * this.bgmVolume;
          gain.gain.setValueAtTime(vol, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.6);
        });
      } catch (e) {}
    }, 600);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // ---- Sound Effects ----
  playDiceTumble() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      const freq = 120 + Math.random() * 80;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 + Math.random() * 200, t);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  playSixRoll() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      [880, 1320, 1760].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.32);
      });
    } catch (e) {}
  }

  playTokenHop(stepIndex = 0) {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 320 + (stepIndex % 8) * 35;
      osc.frequency.setValueAtTime(baseFreq * 1.5, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.05);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch (e) {}
  }

  playCapture() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.29);

      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
    } catch (e) {}
  }

  playSafeSpot() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      [659.25, 987.77].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.06);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.36);
      });
    } catch (e) {}
  }

  playTokenHome() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.45);
      });
    } catch (e) {}
  }

  playVictory() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.15 },
        { f: 1046.50, d: 0.45 }
      ];
      let offset = 0;
      melody.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t + offset);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + item.d + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + item.d + 0.15);
        offset += item.d;
      });
    } catch (e) {}
  }

  playButtonClick() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
      gain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.035);
    } catch (e) {}
  }

  playTick(isWarning = false) {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isWarning ? 1200 : 750, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
      gain.gain.setValueAtTime((isWarning ? 0.22 : 0.12) * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.045);
    } catch (e) {}
  }

  playBlast() {
    this.init();
    if (!this.enabled || !this.ctx || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      gain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();

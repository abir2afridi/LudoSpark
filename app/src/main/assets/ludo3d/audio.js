/**
 * High-quality procedural sound synthesizer using Web Audio API.
 * Completely self-contained: works offline without any external audio files.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
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

  playDiceTumble() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Synthesize realistic wooden dice impact/tumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      const freq = 120 + Math.random() * 80;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 + Math.random() * 200, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playTokenHop(stepIndex = 0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Marimba-like resonant hop pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Slight pitch variation based on step
      const baseFreq = 320 + (stepIndex % 8) * 35;
      osc.frequency.setValueAtTime(baseFreq * 1.5, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.05);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    } catch (e) {}
  }

  playCapture() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Strike impact + descending whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.29);

      // Noise burst for thud
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.3, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
    } catch (e) {}
  }

  playSafeSpot() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Magical star sparkle (dual chime)
      [659.25, 987.77].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.06);

        gain.gain.setValueAtTime(0.2, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.36);
      });
    } catch (e) {}
  }

  playTokenHome() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Ascending triumphant chime
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.25, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.45);
      });
    } catch (e) {}
  }

  playVictory() {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Grand victory fanfare
      const melody = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.15 }, // G5
        { f: 1046.50, d: 0.45 } // C6
      ];
      let offset = 0;
      melody.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t + offset);

        gain.gain.setValueAtTime(0.3, t + offset);
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
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.035);
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();

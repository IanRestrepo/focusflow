/**
 * FocusFlow Sound Engine — Web Audio API only, zero external files.
 * All sounds are synthesized in the browser.
 */

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function enabled(): boolean {
  try { return localStorage.getItem('ff_sound') !== 'off'; } catch { return true; }
}

/** Short soft "ding" — subtask completed */
export function playSubtaskDing() {
  if (!enabled()) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;

    // Soft sine tone with quick attack, gentle decay
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);          // A5
    osc.frequency.exponentialRampToValueAtTime(1046, t + 0.05); // C6

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.start(t);
    osc.stop(t + 0.35);
  } catch {}
}

/** 3-note ascending melody — task fully completed */
export function playTaskComplete() {
  if (!enabled()) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;

    // Pentatonic ascending: C5 → E5 → G5
    const notes = [523.25, 659.25, 783.99];
    const delays = [0, 0.12, 0.24];

    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delays[i]);

      gain.gain.setValueAtTime(0, t + delays[i]);
      gain.gain.linearRampToValueAtTime(0.22, t + delays[i] + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delays[i] + 0.45);

      osc.start(t + delays[i]);
      osc.stop(t + delays[i] + 0.45);
    });
  } catch {}
}

/** Celebratory fanfare — level up */
export function playLevelUp() {
  if (!enabled()) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;

    // Ascending fanfare: C4 E4 G4 C5 (arpegio) + sustain chord
    const steps = [
      { freq: 261.63, delay: 0,    dur: 0.15 },  // C4
      { freq: 329.63, delay: 0.1,  dur: 0.15 },  // E4
      { freq: 392.00, delay: 0.2,  dur: 0.15 },  // G4
      { freq: 523.25, delay: 0.3,  dur: 0.6  },  // C5 (hold)
      { freq: 659.25, delay: 0.35, dur: 0.55 },  // E5 (hold)
      { freq: 783.99, delay: 0.4,  dur: 0.5  },  // G5 (hold)
    ];

    steps.forEach(({ freq, delay, dur }) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.15, t + delay + 0.03);
      gain.gain.setValueAtTime(0.15, t + delay + dur - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);

      osc.start(t + delay);
      osc.stop(t + delay + dur);
    });
  } catch {}
}

/** Subtle reward unlocked — claim reward */
export function playRewardClaim() {
  if (!enabled()) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;

    // Warm descending chord
    const notes = [659.25, 523.25, 392.00]; // E5 C5 G4
    const delays = [0, 0.08, 0.16];

    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delays[i]);

      gain.gain.setValueAtTime(0, t + delays[i]);
      gain.gain.linearRampToValueAtTime(0.14, t + delays[i] + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delays[i] + 0.5);

      osc.start(t + delays[i]);
      osc.stop(t + delays[i] + 0.5);
    });
  } catch {}
}

/** 🔥 Streak day earned — rising fire whoosh + triumphant chord */
export function playStreakDay() {
  if (!enabled()) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;

    // Whoosh: filtered noise sweep
    const bufferSize = ac.sampleRate * 0.6;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const bandpass = ac.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(200, t);
    bandpass.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    bandpass.Q.value = 0.8;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(t);
    noise.stop(t + 0.6);

    // Triumphant chord: F4 A4 C5 F5
    const chord = [349.23, 440, 523.25, 698.46];
    const delays = [0.25, 0.32, 0.38, 0.44];
    chord.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delays[i]);
      gain.gain.setValueAtTime(0, t + delays[i]);
      gain.gain.linearRampToValueAtTime(0.2, t + delays[i] + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delays[i] + 0.7);
      osc.start(t + delays[i]);
      osc.stop(t + delays[i] + 0.75);
    });
  } catch {}
}

/** 🏅 Achievement / badge unlocked — sparkling ascending flourish */
export function playAchievement() {
  if (!enabled()) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;

    // Glittering high notes: G5 B5 D6 G6 — sparkling arpeggio
    const notes = [
      { freq: 783.99, delay: 0,    dur: 0.3  },  // G5
      { freq: 987.77, delay: 0.1,  dur: 0.3  },  // B5
      { freq: 1174.66, delay: 0.2, dur: 0.35 },  // D6
      { freq: 1567.98, delay: 0.32, dur: 0.6 },  // G6 (hold)
    ];

    notes.forEach(({ freq, delay, dur }) => {
      // Main tone
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delay);
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.18, t + delay + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
      osc.start(t + delay);
      osc.stop(t + delay + dur);

      // Shimmer: octave up at lower volume
      const osc2 = ac.createOscillator();
      const gain2 = ac.createGain();
      osc2.connect(gain2);
      gain2.connect(ac.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, t + delay);
      gain2.gain.setValueAtTime(0, t + delay);
      gain2.gain.linearRampToValueAtTime(0.06, t + delay + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + delay + dur * 0.6);
      osc2.start(t + delay);
      osc2.stop(t + delay + dur);
    });

    // Warm sustain chord underneath: C5 E5 G5
    const chord = [523.25, 659.25, 783.99];
    chord.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.28);
      gain.gain.setValueAtTime(0, t + 0.28);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.35);
      gain.gain.setValueAtTime(0.07, t + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      osc.start(t + 0.28);
      osc.stop(t + 1.15);
    });
  } catch {}
}

/** Quick error buzz */
export function playError() {
  if (!enabled()) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  } catch {}
}

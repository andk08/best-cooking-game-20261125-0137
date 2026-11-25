// Dapur Kilat — every sound is synthesized with WebAudio: no audio files,
// no network, just oscillators and filtered noise. Created lazily on the
// first player gesture, so a silent page load stays silent.

const MELODY = [523, 659, 784, 659, 880, 784, 659, 587, 523, 587, 659, 784];
const BASS = [131, 165, 196, 165, 220, 196, 165, 147, 131, 147, 165, 196];

/** Build the sound board. Call `unlock()` from a user gesture first. */
export function createAudio() {
  let context = null;
  let musicTimer = null;
  let musicOn = true;
  let beat = 0;

  function ensureContext() {
    if (context) return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    return context;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
    const ctx = ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function noiseBurst(dur, gain, filterFreq) {
    const ctx = ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const amp = ctx.createGain();
    amp.gain.value = gain;
    source.connect(filter).connect(amp).connect(ctx.destination);
    source.start(start);
  }

  const sounds = {
    pick() { tone(520, 0.07, 'triangle', 0.12); },
    chop() { noiseBurst(0.08, 0.25, 900); tone(180, 0.06, 'square', 0.08, 0, 90); },
    sizzle() { noiseBurst(0.25, 0.12, 4200); },
    ding() { tone(880, 0.18, 'sine', 0.14); tone(1318, 0.28, 'sine', 0.1, 0.07); },
    coin() { tone(988, 0.09, 'triangle', 0.14); tone(1319, 0.22, 'triangle', 0.14, 0.08); },
    error() { tone(160, 0.18, 'sawtooth', 0.1, 0, 110); },
    serve() { tone(659, 0.1, 'triangle', 0.14); tone(784, 0.1, 'triangle', 0.14, 0.09); tone(1047, 0.24, 'triangle', 0.14, 0.18); },
    burn() { tone(220, 0.3, 'sawtooth', 0.1, 0, 70); noiseBurst(0.3, 0.15, 300); },
    over() { tone(392, 0.2, 'triangle', 0.12); tone(330, 0.2, 'triangle', 0.12, 0.18); tone(262, 0.4, 'triangle', 0.12, 0.36); },
    start() { tone(523, 0.12, 'triangle', 0.14); tone(784, 0.2, 'triangle', 0.14, 0.1); },
  };

  function playMusicStep() {
    if (!musicOn || !context || context.state !== 'running') return;
    const i = beat % MELODY.length;
    tone(MELODY[i], 0.22, 'triangle', 0.045);
    if (i % 2 === 0) tone(BASS[i], 0.4, 'sine', 0.06);
    beat += 1;
  }

  return {
    unlock() {
      const ctx = ensureContext();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (ctx && !musicTimer) musicTimer = window.setInterval(playMusicStep, 240);
    },
    play(name) {
      if (context && context.state === 'running' && sounds[name]) sounds[name]();
    },
    toggleMusic() {
      musicOn = !musicOn;
      return musicOn;
    },
    get musicOn() { return musicOn; },
  };
}

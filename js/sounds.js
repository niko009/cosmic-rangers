window.Sound = (() => {
  let ctx = null;
  let muted = false;
  let master = null;
  let compressor = null;
  let noiseBuffer = null; // shared 1s white noise
  let activeVoices = 0;
  const MAX_VOICES = 24;

  // Throttle timestamps (audio context time or performance)
  const last = { shoot: 0, explodeSmall: 0, hit: 0, ui: 0 };

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 8;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.12;
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(compressor);
      compressor.connect(ctx.destination);
      // Prebuild noise once
      const len = ctx.sampleRate; // 1 second
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      return false;
    }
  }

  function resume() {
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  function canPlay() {
    return !muted && ensure() && activeVoices < MAX_VOICES;
  }

  function trackVoice(duration) {
    activeVoices++;
    const ms = Math.ceil((duration + 0.08) * 1000);
    setTimeout(() => {
      activeVoices = Math.max(0, activeVoices - 1);
    }, ms);
  }

  function tone(freq, type, duration, volume = 0.3, detune = 0, attack = 0.01, when = 0) {
    if (!canPlay()) return;
    resume();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (detune) osc.detune.setValueAtTime(detune, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.01, duration));
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    };
    trackVoice(duration + when);
  }

  function noise(duration, volume = 0.2, filterFreq = 800, when = 0) {
    if (!canPlay()) return;
    resume();
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, t);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.02, duration));
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
    src.stop(t + duration + 0.02);
    src.onended = () => {
      try { src.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) {}
    };
    trackVoice(duration + when);
  }

  function throttled(key, minInterval, fn) {
    if (!ctx && !ensure()) return;
    const now = ctx ? ctx.currentTime : performance.now() / 1000;
    if (now - last[key] < minInterval) return;
    last[key] = now;
    fn();
  }

  return {
    isMuted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.35;
      return muted;
    },
    unlock() {
      ensure();
      resume();
    },
    shoot() {
      throttled("shoot", 0.04, () => {
        tone(880, "square", 0.07, 0.1, 0, 0.004);
        tone(1320, "square", 0.04, 0.05, 200, 0.004, 0.01);
      });
    },
    explodeSmall() {
      throttled("explodeSmall", 0.05, () => {
        noise(0.2, 0.18, 1200);
        tone(180, "sawtooth", 0.16, 0.12, 0, 0.008);
      });
    },
    explodeBig() {
      noise(0.4, 0.26, 600);
      tone(90, "sawtooth", 0.35, 0.2, 0, 0.015);
      tone(60, "triangle", 0.4, 0.12, 0, 0.015, 0.05);
    },
    hit() {
      throttled("hit", 0.08, () => {
        tone(220, "sawtooth", 0.12, 0.16, 0, 0.004);
        noise(0.1, 0.12, 400);
      });
    },
    powerup() {
      tone(523, "sine", 0.1, 0.14, 0, 0.01);
      tone(659, "sine", 0.1, 0.14, 0, 0.01, 0.06);
      tone(784, "sine", 0.14, 0.16, 0, 0.01, 0.12);
    },
    shield() {
      tone(400, "sine", 0.28, 0.11, 0, 0.04);
      tone(600, "sine", 0.22, 0.07, 0, 0.04, 0.04);
    },
    bossAppear() {
      tone(110, "sawtooth", 0.55, 0.18, 0, 0.08);
      tone(82, "sawtooth", 0.7, 0.2, 0, 0.08, 0.2);
      noise(0.45, 0.14, 300, 0.05);
    },
    bossDie() {
      noise(0.7, 0.3, 400);
      tone(150, "sawtooth", 0.6, 0.22, 0, 0.04);
      tone(80, "triangle", 0.9, 0.18, 0, 0.08, 0.15);
      tone(523, "sine", 0.18, 0.1, 0, 0.02, 0.4);
      tone(784, "sine", 0.25, 0.12, 0, 0.02, 0.52);
    },
    bossRage() {
      noise(0.5, 0.28, 500);
      tone(70, "sawtooth", 0.45, 0.24, 0, 0.02);
      tone(95, "sawtooth", 0.4, 0.2, 0, 0.02, 0.08);
      tone(140, "square", 0.3, 0.15, 0, 0.01, 0.16);
      tone(180, "sawtooth", 0.22, 0.16, 0, 0.01, 0.28);
      noise(0.25, 0.16, 900, 0.28);
      tone(55, "triangle", 0.6, 0.18, 0, 0.04, 0.2);
    },
    bossWave() {
      noise(0.3, 0.18, 700);
      tone(120, "sine", 0.25, 0.14, 0, 0.02);
      tone(90, "sawtooth", 0.2, 0.12, 0, 0.01, 0.06);
    },
    gameOver() {
      tone(330, "triangle", 0.35, 0.15, 0, 0.04);
      tone(262, "triangle", 0.45, 0.14, 0, 0.04, 0.2);
      tone(196, "triangle", 0.7, 0.12, 0, 0.04, 0.4);
    },
    victory() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, "sine", 0.22, 0.14, 0, 0.015, i * 0.12));
    },
    wave() {
      tone(440, "square", 0.09, 0.09, 0, 0.008);
      tone(554, "square", 0.1, 0.09, 0, 0.008, 0.08);
    },
    ui() {
      throttled("ui", 0.05, () => tone(660, "sine", 0.05, 0.09, 0, 0.004));
    }
  };
})();

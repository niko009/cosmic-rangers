window.Sound = (() => {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  function resume() {
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function tone(freq, type, duration, volume = 0.3, detune = 0, attack = 0.01, decay = 0.1) {
    if (muted || !ensure()) return;
    resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  function noise(duration, volume = 0.2, filterFreq = 800) {
    if (muted || !ensure()) return;
    resume();
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
    src.stop(t + duration + 0.05);
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
      tone(880, "square", 0.08, 0.12, 0, 0.005, 0.04);
      tone(1320, "square", 0.05, 0.06, 200, 0.005, 0.03);
    },
    explodeSmall() {
      noise(0.25, 0.22, 1200);
      tone(180, "sawtooth", 0.2, 0.15, 0, 0.01, 0.15);
    },
    explodeBig() {
      noise(0.45, 0.3, 600);
      tone(90, "sawtooth", 0.4, 0.25, 0, 0.02, 0.3);
      tone(60, "triangle", 0.5, 0.15, 0, 0.02, 0.4);
    },
    hit() {
      tone(220, "sawtooth", 0.15, 0.2, 0, 0.005, 0.1);
      noise(0.12, 0.15, 400);
    },
    powerup() {
      tone(523, "sine", 0.1, 0.15, 0, 0.01, 0.05);
      setTimeout(() => tone(659, "sine", 0.1, 0.15, 0, 0.01, 0.05), 60);
      setTimeout(() => tone(784, "sine", 0.15, 0.18, 0, 0.01, 0.08), 120);
    },
    shield() {
      tone(400, "sine", 0.3, 0.12, 0, 0.05, 0.2);
      tone(600, "sine", 0.25, 0.08, 0, 0.05, 0.15);
    },
    bossAppear() {
      tone(110, "sawtooth", 0.6, 0.2, 0, 0.1, 0.4);
      setTimeout(() => tone(82, "sawtooth", 0.8, 0.22, 0, 0.1, 0.5), 200);
      noise(0.5, 0.15, 300);
    },
    bossDie() {
      noise(0.8, 0.35, 400);
      tone(150, "sawtooth", 0.7, 0.25, 0, 0.05, 0.5);
      setTimeout(() => tone(80, "triangle", 1.0, 0.2, 0, 0.1, 0.7), 150);
      setTimeout(() => {
        tone(523, "sine", 0.2, 0.12, 0, 0.02, 0.1);
        setTimeout(() => tone(784, "sine", 0.3, 0.15, 0, 0.02, 0.15), 100);
      }, 400);
    },
    gameOver() {
      tone(330, "triangle", 0.4, 0.18, 0, 0.05, 0.3);
      setTimeout(() => tone(262, "triangle", 0.5, 0.16, 0, 0.05, 0.35), 200);
      setTimeout(() => tone(196, "triangle", 0.8, 0.14, 0, 0.05, 0.5), 400);
    },
    victory() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => tone(f, "sine", 0.25, 0.16, 0, 0.02, 0.12), i * 120);
      });
    },
    wave() {
      tone(440, "square", 0.1, 0.1, 0, 0.01, 0.06);
      setTimeout(() => tone(554, "square", 0.12, 0.1, 0, 0.01, 0.07), 80);
    },
    ui() {
      tone(660, "sine", 0.06, 0.1, 0, 0.005, 0.03);
    }
  };
})();

const canvas = document.getElementById("game");
const game = new Game(canvas);
window.game = game;

const score = document.getElementById("score");
const wave = document.getElementById("wave");
const highScore = document.getElementById("highScore");
const hpBar = document.getElementById("hpBar");
const powerups = document.getElementById("powerups");
const bossWrap = document.getElementById("bossWrap");
const bossBar = document.getElementById("bossBar");
const endTitle = document.getElementById("endTitle");
const endReason = document.getElementById("endReason");
const finalScore = document.getElementById("finalScore");
const finalWave = document.getElementById("finalWave");

const playBtn = document.getElementById("playBtn");
const howBtn = document.getElementById("howBtn");
const resumeBtn = document.getElementById("resumeBtn");
const againBtn = document.getElementById("againBtn");
const menuBtn = document.getElementById("menuBtn");
const backBtn = document.getElementById("backBtn");
const menu = document.getElementById("menu");
const howScreen = document.getElementById("howScreen");
const pauseScreen = document.getElementById("pauseScreen");
const gameOver = document.getElementById("gameOver");
const hud = document.getElementById("hud");
const touch = document.getElementById("touchControls");
const touchFire = document.getElementById("touchFire");

const ui = {
  menu,
  hud,
  pauseScreen,
  gameOver,
  howScreen,
  touch,
  updateHud(g) {
    score.textContent = g.score;
    wave.textContent = g.wave;
    highScore.textContent = Math.max(AppStorage.getHighScore(), g.score);
    hpBar.style.width = Math.max(0, (g.player.hp / g.player.maxHp) * 100) + "%";
    powerups.innerHTML = "";

    // Weapon status + progress
    const wType = (g.player.weaponType || "laser").toUpperCase();
    const wLv = g.player.weaponLevel || 1;
    const wColors = { laser: "#53e8ff", plasma: "#c45cff", spread: "#ffd84d", missile: "#ff6b4a" };
    const kills = g.player.kills || 0;
    const wProg = wLv >= 5 ? "MAX" : `${kills % 12}/12`;
    const wd = document.createElement("div");
    wd.className = "power";
    wd.style.color = wColors[g.player.weaponType] || "#53e8ff";
    wd.textContent = `🔫 ${wType} LV.${wLv} (${wProg})`;
    powerups.appendChild(wd);

    const aLv = g.player.armorLevel || 1;
    const aProg = aLv >= 5 ? "MAX" : `${kills % 15}/15`;
    const ad = document.createElement("div");
    ad.className = "power";
    ad.style.color = "#7cffb2";
    ad.textContent = `🛡 ARMOR LV.${aLv} (${aProg})`;
    powerups.appendChild(ad);

    const powers = [
      ["overcharge", "🔥 OVERCHARGE"],
      ["rapid", "⚡ RAPID FIRE"],
      ["shield", "🛡 SHIELD"]
    ];
    for (const [key, label] of powers) {
      if (g.player[key] > 0) {
        const d = document.createElement("div");
        d.className = "power";
        d.style.color = key === "shield" ? "#9b7cff" : key === "rapid" ? "#53e8ff" : "#ff9d4d";
        d.textContent = `${label} ${g.player[key].toFixed(1)}s`;
        powerups.appendChild(d);
      }
    }
    bossWrap.classList.toggle("hidden", !g.boss);
    if (g.boss) bossBar.style.width = Math.max(0, (g.boss.hp / g.boss.maxHp) * 100) + "%";
  },
  start() {
    [this.menu, this.gameOver, this.howScreen, this.pauseScreen].forEach(x => x.classList.add("hidden"));
    this.hud.classList.remove("hidden");
    this.touch.classList.remove("hidden");
    game.start();
  },
  pause(on) {
    this.pauseScreen.classList.toggle("hidden", !on);
  },
  showEnd(win, s, w) {
    this.hud.classList.add("hidden");
    this.touch.classList.add("hidden");
    this.gameOver.classList.remove("hidden");
    endTitle.textContent = win ? "VICTORY!" : "GAME OVER";
    endReason.textContent = win ? "BOSS DESTROYED" : "Корабль уничтожен";
    finalScore.textContent = s;
    finalWave.textContent = w;
  },
  showMenu() {
    this.gameOver.classList.add("hidden");
    this.pauseScreen.classList.add("hidden");
    this.hud.classList.add("hidden");
    this.touch.classList.add("hidden");
    this.menu.classList.remove("hidden");
  }
};
window.ui = ui;

function unlockAudio() {
  if (window.Sound) Sound.unlock();
}

playBtn.onclick = () => {
  unlockAudio();
  if (window.Sound) Sound.ui();
  ui.start();
};
againBtn.onclick = () => {
  unlockAudio();
  if (window.Sound) Sound.ui();
  ui.start();
};
resumeBtn.onclick = () => {
  if (window.Sound) Sound.ui();
  game.togglePause();
};
menuBtn.onclick = () => {
  if (window.Sound) Sound.ui();
  ui.showMenu();
};
howBtn.onclick = () => {
  if (window.Sound) Sound.ui();
  menu.classList.add("hidden");
  howScreen.classList.remove("hidden");
};
backBtn.onclick = () => {
  if (window.Sound) Sound.ui();
  howScreen.classList.add("hidden");
  menu.classList.remove("hidden");
};

const muteBtn = document.getElementById("muteBtn");
function updateMuteLabel() {
  if (!muteBtn || !window.Sound) return;
  muteBtn.textContent = Sound.isMuted() ? "🔇 MUTED" : "🔊 SOUND";
}
if (muteBtn) {
  muteBtn.onclick = () => {
    if (window.Sound) {
      Sound.toggleMute();
      updateMuteLabel();
      if (!Sound.isMuted()) Sound.ui();
    }
  };
}

addEventListener("keydown", e => {
  game.keys[e.code] = true;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyP") game.togglePause();
  if (e.code === "KeyM" && window.Sound) {
    Sound.toggleMute();
    updateMuteLabel();
  }
});
addEventListener("keyup", e => {
  game.keys[e.code] = false;
});

game.touchFire = false;
touchFire.addEventListener("pointerdown", e => {
  e.preventDefault();
  game.touchFire = true;
});
["pointerup", "pointercancel", "pointerleave"].forEach(type =>
  touchFire.addEventListener(type, () => (game.touchFire = false))
);

document.querySelectorAll(".touch-move button").forEach(btn => {
  const code = btn.dataset.key;
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    game.keys[code] = true;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(t =>
    btn.addEventListener(t, () => (game.keys[code] = false))
  );
});

// Unlock audio on first user gesture (browser policy)
["pointerdown", "keydown"].forEach(ev => {
  const once = () => {
    unlockAudio();
    removeEventListener(ev, once);
  };
  addEventListener(ev, once, { once: true });
});

game.draw();

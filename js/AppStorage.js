window.AppStorage = {
  getHighScore() {
    try { return Number(localStorage.getItem("cosmic-rangers-highscore")) || 0; }
    catch (e) { return 0; }
  },
  setHighScore(score) {
    try { localStorage.setItem("cosmic-rangers-highscore", String(score)); }
    catch (e) {}
  },
  getUnlockedWeapons() {
    try {
      const raw = localStorage.getItem("cosmic-rangers-weapons");
      if (!raw) return ["laser"];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return ["laser"];
      if (!list.includes("laser")) list.unshift("laser");
      return list;
    } catch (e) {
      return ["laser"];
    }
  },
  unlockWeapon(type) {
    try {
      const list = this.getUnlockedWeapons();
      if (!list.includes(type)) {
        list.push(type);
        localStorage.setItem("cosmic-rangers-weapons", JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return ["laser"];
    }
  },
  getBestShipTier() {
    try { return Number(localStorage.getItem("cosmic-rangers-best-tier")) || 1; }
    catch (e) { return 1; }
  },
  setBestShipTier(tier) {
    try {
      const cur = this.getBestShipTier();
      if (tier > cur) localStorage.setItem("cosmic-rangers-best-tier", String(tier));
    } catch (e) {}
  },
  getMaxWeaponLevel() {
    try {
      const n = Number(localStorage.getItem("cosmic-rangers-max-weapon-level"));
      return Math.min(5, Math.max(1, n || 1));
    } catch (e) { return 1; }
  },
  setMaxWeaponLevel(level) {
    try {
      const cur = this.getMaxWeaponLevel();
      const next = Math.min(5, Math.max(1, level));
      if (next > cur) localStorage.setItem("cosmic-rangers-max-weapon-level", String(next));
    } catch (e) {}
  }
,
  getControlMode() {
    try {
      const m = localStorage.getItem("cosmic-rangers-control");
      if (m === "mouse" || m === "touch" || m === "keyboard") return m;
    } catch (e) {}
    return "keyboard";
  },
  setControlMode(mode) {
    try {
      if (mode === "mouse" || mode === "touch" || mode === "keyboard")
        localStorage.setItem("cosmic-rangers-control", mode);
    } catch (e) {}
  }
};

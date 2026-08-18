window.AppStorage = {
  getHighScore(){
    try { return Number(localStorage.getItem("cosmic-rangers-highscore")) || 0; }
    catch(e) { return 0; }
  },
  setHighScore(score){
    try { localStorage.setItem("cosmic-rangers-highscore", String(score)); }
    catch(e) {}
  }
};

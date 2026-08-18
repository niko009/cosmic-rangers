class Game{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext("2d");this.resize();
    this.stars=new Starfield();this.particles=new ParticleSystem();
    this.player={x:innerWidth/2,y:innerHeight-100,r:18,hp:100,maxHp:100,speed:330,fire:0,rapid:0,overcharge:0,shield:0,weaponLevel:1,weaponType:"laser",armorLevel:1,kills:0};
    this.bullets=[];this.enemyBullets=[];this.meteors=[];this.powerups=[];this.boss=null;
    this.score=0;this.wave=1;this.waveKills=0;this.waveTarget=8;this.waveTimer=1.5;
    this.spawnTimer=0;this.running=false;this.paused=false;this.won=false;this.shake=0;this.boost=false;
    this.flash=0;this.flashColor="#ff4f72";
    this.keys={};this.last=0;
    addEventListener("resize",()=>this.resize());
  }
  resize(){this.canvas.width=innerWidth*devicePixelRatio;this.canvas.height=innerHeight*devicePixelRatio;this.ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);if(this.player)this.player.y=Math.min(innerHeight-80,this.player.y)}
  reset(){
    this.player={x:innerWidth/2,y:innerHeight-100,r:18,hp:100,maxHp:100,speed:330,fire:0,rapid:0,overcharge:0,shield:0,weaponLevel:1,weaponType:"laser",armorLevel:1,kills:0};
    this.bullets=[];this.enemyBullets=[];this.meteors=[];this.powerups=[];this.boss=null;this.score=0;this.wave=1;this.waveKills=0;this.waveTarget=8;this.waveTimer=1.5;this.spawnTimer=.3;this.shake=0;this.flash=0;this.running=true;this.paused=false;this.won=false;this.last=performance.now();
  }
  // Armor tables: max HP and damage reduction (0..0.4)
  armorStats(level){
    const table = [
      null,
      { maxHp: 100, reduce: 0 },
      { maxHp: 125, reduce: 0.08 },
      { maxHp: 155, reduce: 0.15 },
      { maxHp: 190, reduce: 0.22 },
      { maxHp: 230, reduce: 0.30 }
    ];
    return table[Math.min(5, Math.max(1, level))] || table[1];
  }
  // Weapon level: guns, damage mult, fire rate mult
  weaponStats(level){
    const table = [
      null,
      { guns: 1, dmgMul: 1.0,  rateMul: 1.0,  angles: [0] },
      { guns: 2, dmgMul: 1.1,  rateMul: 1.05, angles: [-0.12, 0.12] },
      { guns: 3, dmgMul: 1.2,  rateMul: 1.1,  angles: [-0.2, 0, 0.2] },
      { guns: 4, dmgMul: 1.35, rateMul: 1.15, angles: [-0.28, -0.1, 0.1, 0.28] },
      { guns: 5, dmgMul: 1.5,  rateMul: 1.2,  angles: [-0.34, -0.17, 0, 0.17, 0.34] }
    ];
    return table[Math.min(5, Math.max(1, level))] || table[1];
  }
  upgradeArmor(){
    const p = this.player;
    if (p.armorLevel >= 5) return false;
    p.armorLevel++;
    const stats = this.armorStats(p.armorLevel);
    const oldMax = p.maxHp;
    p.maxHp = stats.maxHp;
    p.hp = Math.min(p.maxHp, p.hp + (p.maxHp - oldMax) * 0.6 + 15);
    this.showMessage("ARMOR LV." + p.armorLevel);
    this.particles.sparkle(p.x, p.y, "#4dff9b", 22);
    if (window.Sound) Sound.powerup();
    return true;
  }
  upgradeWeapon(){
    const p = this.player;
    if (p.weaponLevel >= 5) return false;
    p.weaponLevel++;
    this.showMessage("WEAPON LV." + p.weaponLevel);
    this.particles.sparkle(p.x, p.y, "#ffd84d", 22);
    if (window.Sound) Sound.powerup();
    return true;
  }
  update(dt){
    if(!this.running||this.paused)return;
    dt=Math.min(dt,.033);
    this.stars.update(dt,this.boost?1.8:1);
    this.particles.update(dt);
    const p=this.player;
    p.rapid=Math.max(0,p.rapid-dt);p.overcharge=Math.max(0,p.overcharge-dt);p.shield=Math.max(0,p.shield-dt);
    const dx=(this.keys.ArrowRight||this.keys.KeyD?1:0)-(this.keys.ArrowLeft||this.keys.KeyA?1:0);
    const dy=(this.keys.ArrowDown||this.keys.KeyS?1:0)-(this.keys.ArrowUp||this.keys.KeyW?1:0);
    const len=Math.hypot(dx,dy)||1;
    this.boost = !!(this.keys.ShiftLeft || this.keys.ShiftRight);
    const speed = p.speed * (this.boost ? 1.65 : 1);
    p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;p.x=Math.max(25,Math.min(innerWidth-25,p.x));p.y=Math.max(40,Math.min(innerHeight-35,p.y));

    // Engine trail particles
    if (dx !== 0 || dy !== 0 || this.boost) {
      const thrusterColor = this.boost ? "#ff9d4d" : "#53e8ff";
      const count = this.boost ? 5 : 2;
      this.particles.trail(p.x, p.y + 18, Math.PI / 2, thrusterColor, count, this.boost ? 180 : 90);
    }

    const firing=this.keys.Space||this.touchFire;
    p.fire-=dt;
    if(firing&&p.fire<=0)this.shoot();
    for(const b of this.bullets)b.update(dt, this);
    for(const b of this.enemyBullets)b.update(dt);
    for(const m of this.meteors){
      if(m.kind==="drone") m.update(dt,this);
      else m.update(dt);
    }
    for(const u of this.powerups)u.update(dt);
    this.bullets=this.bullets.filter(x=>!x.dead);this.enemyBullets=this.enemyBullets.filter(x=>!x.dead);this.meteors=this.meteors.filter(x=>!x.dead);this.powerups=this.powerups.filter(x=>!x.dead);
    if(this.boss){this.boss.update(dt,this)}else this.spawnWave(dt);
    this.collisions();
    this.shake=Math.max(0,this.shake-dt*3);
    this.flash=Math.max(0,this.flash-dt*4);
    this.updateHud();
  }
  shoot(){
    const p = this.player;
    const level = Math.min(5, p.weaponLevel + (p.overcharge > 0 ? 1 : 0));
    const w = this.weaponStats(level);
    let type = p.weaponType || "laser";
    let angles = w.angles.slice();
    let speed = 620;
    let damage = 1 * w.dmgMul;
    let fireRate = (p.rapid > 0 ? 0.075 : 0.18) / w.rateMul;

    if (type === "plasma") {
      speed = 400;
      damage = 2.4 * w.dmgMul;
      fireRate = (p.rapid > 0 ? 0.12 : 0.28) / w.rateMul;
      // fewer barrels, heavier hits
      if (level >= 4) angles = [-0.18, 0, 0.18];
      else if (level >= 2) angles = [-0.12, 0.12];
      else angles = [0];
    } else if (type === "spread") {
      speed = 540;
      damage = 0.8 * w.dmgMul;
      fireRate = (p.rapid > 0 ? 0.09 : 0.2) / w.rateMul;
      angles = angles.map(a => a * 1.4);
      if (level === 1) angles = [-0.15, 0.15];
    } else if (type === "missile") {
      speed = 280;
      damage = 3.2 * w.dmgMul;
      fireRate = (p.rapid > 0 ? 0.18 : 0.38) / w.rateMul;
      if (level >= 4) angles = [-0.2, 0, 0.2];
      else if (level >= 2) angles = [-0.12, 0.12];
      else angles = [0];
    }

    if (p.overcharge > 0) damage *= 1.5;

    for (const a of angles) {
      const vx = Math.sin(a) * speed;
      const vy = -Math.cos(a) * speed;
      this.bullets.push(new Bullet(p.x + Math.sin(a) * 6, p.y - 18, vx, vy, damage, type));
      const flashColor = type === "plasma" ? "#c45cff" : type === "spread" ? "#ffd84d" : type === "missile" ? "#ff6b4a" : "#dffbff";
      this.particles.trail(p.x + Math.sin(a) * 8, p.y - 22, -Math.PI / 2 + a, flashColor, 3, 180);
    }
    p.fire = fireRate;
    if (window.Sound) Sound.shoot();
  }
  spawnWave(dt){
    if(this.waveTimer>0){this.waveTimer-=dt;return}
    this.spawnTimer-=dt;
    if(this.waveKills>=this.waveTarget&&this.meteors.length===0){this.nextWave();return}
    if(this.spawnTimer<=0&&this.waveKills<this.waveTarget){
      this.meteors.push(this.spawnEnemy());
      this.spawnTimer=Math.max(.22, .72-this.wave*.028);
    }
  }
  spawnEnemy(){
    const w = this.wave;
    const roll = Math.random();
    // Unlock new types by wave
    if (w >= 3 && roll < 0.22) return new Weaver(w);
    if (w >= 5 && roll < 0.40) return new ZigZag(w);
    if (w >= 7 && roll < 0.55) return new HomingDrone(w);
    // Early waves: mostly meteors, later mixed
    if (w >= 4 && roll < 0.18) return new Weaver(w);
    if (w >= 6 && roll < 0.30) return new ZigZag(w);
    return new Meteor(w);
  }
  nextWave(){
    if(this.wave%5===0){this.startBoss();return}
    this.wave++;this.waveKills=0;this.waveTarget=7+this.wave*2;this.waveTimer=1.5;this.showMessage("WAVE "+this.wave);
    if(window.Sound) Sound.wave();
  }
  startBoss(){
    this.showMessage("⚠ BOSS APPROACHING ⚠");this.boss=new Boss();
    if(window.Sound) Sound.bossAppear();
  }
  bossDefeated(){
    const bx = this.boss ? this.boss.x : innerWidth/2;
    const by = this.boss ? this.boss.y : 125;
    this.score+=10000;this.boss=null;this.wave++;this.waveKills=0;this.waveTarget=7+this.wave*2;this.waveTimer=2;this.showMessage("BOSS DESTROYED");
    this.particles.burst(bx, by, "#ff4f72", 60, 420, { size: 5, type: "circle" });
    this.particles.burst(bx, by, "#ff9a45", 40, 350, { size: 3 });
    this.particles.burst(bx, by, "#ffd84d", 25, 280, { type: "circle" });
    this.particles.ring(bx, by, "#ff4f72", 160);
    this.particles.ring(bx, by, "#ff9a45", 100);
    this.shake = 0.8;
    this.flash = 0.5;
    this.flashColor = "#ff4f72";
    if(window.Sound) Sound.bossDie();
  }
  collisions(){
    const p=this.player;
    for(const b of this.bullets){
      for(const m of this.meteors){
        if(m.dead)continue;
        if(Math.hypot(b.x-m.x,b.y-m.y)<m.r+5){
          b.dead=true;m.hp-=b.damage;
          this.particles.burst(b.x,b.y,"#ffd84d",6,110,{type:"circle",size:2});
          if(m.hp<=0)this.destroyMeteor(m);
          break;
        }
      }
      if(this.boss&&!b.dead&&Math.hypot(b.x-this.boss.x,b.y-this.boss.y)<this.boss.r){
        b.dead=true;this.boss.hp-=b.damage;
        this.particles.burst(b.x,b.y,"#ff5b7d",5,100,{type:"circle"});
        if(this.boss.hp<=0)this.bossDefeated();
      }
    }
    for(const eb of this.enemyBullets){if(Math.hypot(eb.x-p.x,eb.y-p.y)<p.r+eb.r){eb.dead=true;this.damage(eb.damage)}}
    for(const m of this.meteors){
      if(Math.hypot(m.x-p.x,m.y-p.y)<m.r+p.r){
        m.dead=true;
        const dmg = m.big ? 28 : (m.kind ? 22 : 18);
        this.damage(dmg);
        this.particles.burst(m.x,m.y, m.kind==="drone"?"#c45cff":"#9b7a92", 22, 200, {size:3});
      }
    }
    for(const u of this.powerups){if(Math.hypot(u.x-p.x,u.y-p.y)<u.r+p.r){u.dead=true;this.applyPower(u.type)}}
  }
  destroyMeteor(m){
    m.dead=true;this.waveKills++;
    const pts = m.score || (m.big ? 450 : 120);
    this.score += pts;
    this.player.kills++;

    // Progression: weapon every 12 kills, armor every 15 kills
    if (this.player.kills % 12 === 0) this.upgradeWeapon();
    if (this.player.kills % 15 === 0) this.upgradeArmor();

    let col = "#5ad0ff";
    let count = 16;
    let speed = 180;
    if (m.big || m.kind === "cruiser") { col = "#ff6b8a"; count = 32; speed = 280; }
    else if (m.kind === "weaver") { col = "#53e8ff"; count = 20; speed = 200; }
    else if (m.kind === "zigzag") { col = "#ff9d4d"; count = 22; speed = 220; }
    else if (m.kind === "drone") { col = "#c45cff"; count = 24; speed = 240; }
    else if (m.kind === "fighter") { col = "#4dff9b"; count = 14; speed = 170; }

    this.particles.burst(m.x, m.y, col, count, speed, { size: m.big ? 4 : 2.8 });
    this.particles.burst(m.x, m.y, "#ffd84d", Math.floor(count/2), speed * 0.7, { type: "circle", size: 2 });
    if (m.big || m.kind === "drone" || m.kind === "cruiser") this.particles.ring(m.x, m.y, col, m.big ? 70 : 50);
    if(window.Sound) (m.big || m.kind === "drone" || m.kind === "cruiser") ? Sound.explodeBig() : Sound.explodeSmall();
    if(Math.random() < (m.kind && m.kind !== "fighter" ? 0.24 : 0.15)){
      const types=["overcharge","rapid","shield","repair","nova","weapon","plasma","spread","missile","armor"];
      this.powerups.push(new PowerUp(m.x,m.y,types[Math.floor(Math.random()*types.length)]));
    }
  }
  damage(amount){
    if(this.player.shield>0){
      this.particles.sparkle(this.player.x, this.player.y, "#8d78ff", 8);
      return;
    }
    const stats = this.armorStats(this.player.armorLevel || 1);
    const reduced = amount * (1 - stats.reduce);
    this.player.hp -= reduced;
    this.shake=.4;this.flash=.35;this.flashColor="#ff4f72";
    this.particles.burst(this.player.x,this.player.y,"#ff4f72",16,200,{type:"circle"});
    this.particles.burst(this.player.x,this.player.y,"#ff9a45",8,140);
    if(window.Sound) Sound.hit();
    if(this.player.hp<=0)this.end(false);
  }
  applyPower(type){
    const p=this.player;
    if(type==="overcharge")p.overcharge=10;
    if(type==="rapid")p.rapid=10;
    if(type==="shield")p.shield=10;
    if(type==="repair")p.hp=Math.min(p.maxHp,p.hp+35);
    if(type==="armor"){
      if(!this.upgradeArmor()){
        p.hp=Math.min(p.maxHp,p.hp+40);
        this.showMessage("ARMOR REPAIR");
      }
    }
    if(type==="weapon"){
      if(!this.upgradeWeapon()){p.overcharge=8;this.showMessage("OVERCHARGE");}
    }
    if(type==="plasma"){p.weaponType="plasma";this.showMessage("PLASMA CANNON");}
    if(type==="spread"){p.weaponType="spread";this.showMessage("SPREAD GUNS");}
    if(type==="missile"){p.weaponType="missile";this.showMessage("MISSILES");}
    if(type==="nova"){
      for(const m of this.meteors){m.hp=0;this.destroyMeteor(m)}
      for(const e of this.enemyBullets)e.dead=true;
      this.particles.burst(p.x,p.y,"#ff5cff",80,520,{type:"circle",size:4});
      this.particles.ring(p.x,p.y,"#ff5cff",140);
      this.shake=.5;
    }
    const sparkColor = type==="shield"?"#8d78ff":type==="repair"?"#4dff9b":type==="plasma"?"#c45cff":type==="missile"?"#ff6b4a":type==="spread"?"#ffd84d":"#ffd84d";
    this.particles.sparkle(p.x, p.y, sparkColor, 18);
    if(!["weapon","plasma","spread","missile","armor"].includes(type)) this.showMessage(type.toUpperCase());
    if(window.Sound) type === "shield" ? Sound.shield() : Sound.powerup();
  }
  end(win){
    this.running=false;this.won=win;cancelAnimationFrame(this.raf);if(this.score>AppStorage.getHighScore())AppStorage.setHighScore(this.score);window.ui.showEnd(win,this.score,this.wave);
    if(window.Sound) win ? Sound.victory() : Sound.gameOver();
  }
  showMessage(text){
    const el=document.getElementById("waveMessage");el.textContent=text;el.classList.add("show");clearTimeout(this.msgTimer);this.msgTimer=setTimeout(()=>el.classList.remove("show"),1200);
  }
  updateHud(){window.ui.updateHud(this)}
  draw(){
    const c=this.ctx;c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);c.clearRect(0,0,innerWidth,innerHeight);
    c.fillStyle="#03050d";c.fillRect(0,0,innerWidth,innerHeight);this.stars.draw(c);
    c.save();if(this.shake>0)c.translate((Math.random()-.5)*this.shake*18,(Math.random()-.5)*this.shake*18);
    for(const m of this.meteors)m.draw(c);for(const u of this.powerups)u.draw(c);for(const b of this.bullets)b.draw(c);for(const b of this.enemyBullets)b.draw(c);if(this.boss)this.boss.draw(c);this.drawPlayer(c);this.particles.draw(c);c.restore();

    // Screen flash (damage / boss death)
    if (this.flash > 0) {
      c.fillStyle = this.flashColor;
      c.globalAlpha = this.flash * 0.35;
      c.fillRect(0, 0, innerWidth, innerHeight);
      c.globalAlpha = 1;
    }
  }
  drawPlayer(c){
    const p=this.player;c.save();c.translate(p.x,p.y);if(this.boost){c.fillStyle="#ff9d4d";c.shadowBlur=20;c.shadowColor="#ff9d4d";c.beginPath();c.moveTo(-7,15);c.lineTo(0,38+Math.random()*12);c.lineTo(7,15);c.fill()}
    c.shadowBlur=22;c.shadowColor="#53e8ff";c.fillStyle="#172944";c.strokeStyle="#53e8ff";c.lineWidth=2;
    c.beginPath();c.moveTo(0,-25);c.lineTo(19,18);c.lineTo(7,13);c.lineTo(0,22);c.lineTo(-7,13);c.lineTo(-19,18);c.closePath();c.fill();c.stroke();
    // Armor plating layers at higher levels
    if ((p.armorLevel || 1) >= 2) {
      c.strokeStyle = "#4dff9b";
      c.globalAlpha = 0.35 + (p.armorLevel - 1) * 0.08;
      c.lineWidth = 1.5 + (p.armorLevel - 1) * 0.4;
      c.beginPath();c.moveTo(0,-22);c.lineTo(16,15);c.lineTo(0,18);c.lineTo(-16,15);c.closePath();c.stroke();
      c.globalAlpha = 1;
    }
    c.fillStyle="#dffbff";c.beginPath();c.ellipse(0,-7,7,11,0,0,Math.PI*2);c.fill();
    if(p.shield>0){c.strokeStyle="#8d78ff";c.globalAlpha=.7+.2*Math.sin(performance.now()/100);c.beginPath();c.arc(0,0,30,0,Math.PI*2);c.stroke()}
    c.restore();
  }
  loop(t){if(!this.running)return;const dt=(t-this.last)/1000;this.last=t;this.update(dt);this.draw();this.raf=requestAnimationFrame(x=>this.loop(x))}
  start(){this.reset();this.raf=requestAnimationFrame(x=>this.loop(x))}
  togglePause(){if(!this.running)return;this.paused=!this.paused;window.ui.pause(this.paused);if(!this.paused)this.last=performance.now()}
}

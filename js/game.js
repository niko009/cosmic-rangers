class Game{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext("2d");this.resize();
    this.stars=new Starfield();this.particles=new ParticleSystem();
    this.player={x:innerWidth/2,y:innerHeight-100,r:18,hp:100,maxHp:100,speed:330,fire:0,rapid:0,overcharge:0,shield:0,weaponLevel:1,weaponType:"laser",weaponXP:0,clone:0,armorLevel:1,kills:0,shipTier:1,unlockedWeapons:["laser"]};
    this.bullets=[];this.enemyBullets=[];this.meteors=[];this.powerups=[];this.boss=null;
    this.score=0;this.wave=1;this.waveKills=0;this.waveTarget=8;this.waveTimer=1.5;
    this.spawnTimer=0;this.running=false;this.paused=false;this.won=false;this.shake=0;this.boost=false;
    this.flash=0;this.flashColor="#ff4f72";
    this.bossesKilled=0;this.aggression=1;
    this.keys={};this.last=0;this.controlMode="keyboard";this.mouse={x:0,y:0,down:false,right:false,active:false};
    addEventListener("resize",()=>this.resize());
  }
  resize(){this.canvas.width=innerWidth*devicePixelRatio;this.canvas.height=innerHeight*devicePixelRatio;this.ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);if(this.player)this.player.y=Math.min(innerHeight-80,this.player.y)}
  reset(){
    this.player={x:innerWidth/2,y:innerHeight-100,r:18,hp:100,maxHp:100,speed:330,fire:0,rapid:0,overcharge:0,shield:0,weaponLevel:1,weaponType:"laser",weaponXP:0,clone:0,armorLevel:1,kills:0,shipTier:1,unlockedWeapons:(typeof AppStorage!=="undefined"?AppStorage.getUnlockedWeapons():["laser"])};
    this.bullets=[];this.enemyBullets=[];this.meteors=[];this.powerups=[];this.boss=null;this.score=0;this.wave=1;this.waveKills=0;this.waveTarget=8;this.waveTimer=1.5;this.spawnTimer=.3;this.shake=0;this.flash=0;this.running=true;this.paused=false;this.won=false;this.last=performance.now();
    this.bossesKilled=0;this.aggression=1;
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
      { guns: 7, dmgMul: 1.5,  rateMul: 1.2,  angles: null }  // full-screen fan computed in shoot()
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
  upgradeWeapon(fromBoss=false){
    const p = this.player;
    // Until the first boss is beaten, weapon stays at LV.1
    if (!fromBoss && (this.bossesKilled || 0) < 1) {
      this.showMessage("WEAPON LOCKED");
      return false;
    }
    if (p.weaponLevel >= 5) return false;
    p.weaponLevel++;
    p.weaponXP = 0;
    if (typeof AppStorage !== "undefined" && AppStorage.setMaxWeaponLevel) AppStorage.setMaxWeaponLevel(p.weaponLevel);
    this.showMessage("WEAPON LV." + p.weaponLevel);
    this.particles.sparkle(p.x, p.y, "#ffd84d", 22);
    if (window.Sound) Sound.powerup();
    return true;
  }
  enemyWeaponXP(m){
    // XP by enemy weight
    if (!m) return 1;
    if (m.big || m.kind === "cruiser") return 5;
    if (m.kind === "drone") return 4;
    if (m.kind === "zigzag") return 3;
    if (m.kind === "weaver") return 3;
    if (m.kind === "fighter") return 2;
    return 1;
  }
  addWeaponXP(amount=1){
    const p = this.player;
    // No weapon XP before first boss — keeps early waves at LV.1
    if ((this.bossesKilled || 0) < 1) return;
    if (p.weaponLevel >= 5) return;
    p.weaponXP = (p.weaponXP || 0) + amount;
    const need = 12;
    if (p.weaponXP >= need) this.upgradeWeapon(false);
  }
  cycleWeapon(){
    const p = this.player;
    const order = ["laser","plasma","spread","missile"];
    const unlocked = p.unlockedWeapons || ["laser"];
    const avail = order.filter(t => unlocked.includes(t));
    if (avail.length < 2) { this.showMessage("NEED MORE WEAPONS"); return; }
    const i = avail.indexOf(p.weaponType);
    p.weaponType = avail[(i + 1) % avail.length];
    this.showMessage(p.weaponType.toUpperCase());
    if (window.Sound) Sound.ui();
  }
  unlockWeaponType(type){
    const p = this.player;
    if (!p.unlockedWeapons) p.unlockedWeapons = ["laser"];
    if (!p.unlockedWeapons.includes(type)) {
      p.unlockedWeapons.push(type);
      if (typeof AppStorage !== "undefined") AppStorage.unlockWeapon(type);
      this.showMessage("UNLOCKED " + type.toUpperCase());
    }
    p.weaponType = type;
  }
  update(dt){
    if(!this.running||this.paused)return;
    dt=Math.min(dt,.033);
    this.stars.update(dt,this.boost?1.8:1);
    this.particles.update(dt);
    const p=this.player;
    p.rapid=Math.max(0,p.rapid-dt);p.overcharge=Math.max(0,p.overcharge-dt);p.shield=Math.max(0,p.shield-dt);p.clone=Math.max(0,(p.clone||0)-dt);
    const mode = this.controlMode || "keyboard";
    let moving = false;
    this.boost = !!(this.keys.ShiftLeft || this.keys.ShiftRight || (mode === "mouse" && this.mouse.right));
    const tierSpeed = 1 + ((p.shipTier || 1) - 1) * 0.06;
    const speed = p.speed * tierSpeed * (this.boost ? 1.65 : 1);

    if (mode === "mouse" && this.mouse.active) {
      // Tight follow: almost 1:1 with cursor (slight lerp only for micro-jitter)
      const tx = Math.max(25, Math.min(innerWidth - 25, this.mouse.x));
      const ty = Math.max(40, Math.min(innerHeight - 35, this.mouse.y));
      const dxm = tx - p.x, dym = ty - p.y;
      const dist = Math.hypot(dxm, dym);
      if (dist > 0.5) {
        // Exponential catch-up: ~25x/s → feels locked to cursor
        const k = 1 - Math.exp(-25 * dt);
        p.x += dxm * k;
        p.y += dym * k;
        moving = dist > 3;
      }
    } else {
      const dx=(this.keys.ArrowRight||this.keys.KeyD?1:0)-(this.keys.ArrowLeft||this.keys.KeyA?1:0);
      const dy=(this.keys.ArrowDown||this.keys.KeyS?1:0)-(this.keys.ArrowUp||this.keys.KeyW?1:0);
      const len=Math.hypot(dx,dy)||1;
      if (dx || dy) {
        p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;
        moving = true;
      }
      p.x=Math.max(25,Math.min(innerWidth-25,p.x));p.y=Math.max(40,Math.min(innerHeight-35,p.y));
    }
    p.x=Math.max(25,Math.min(innerWidth-25,p.x));p.y=Math.max(40,Math.min(innerHeight-35,p.y));

    // Engine trail particles
    if (moving || this.boost) {
      const thrusterColor = this.boost ? "#ff9d4d" : "#53e8ff";
      const count = this.boost ? 5 : 2;
      this.particles.trail(p.x, p.y + 18, Math.PI / 2, thrusterColor, count, this.boost ? 180 : 90);
    }

    const firing=this.keys.Space||this.touchFire||(mode==="mouse"&&this.mouse.down);
    p.fire-=dt;
    if(firing&&p.fire<=0)this.shoot();
    for(const b of this.bullets)b.update(dt, this);
    for(const b of this.enemyBullets)b.update(dt);
    for(const m of this.meteors){
      if(m.kind==="drone") m.update(dt,this);
      else m.update(dt);
    }
    for(const u of this.powerups)u.update(dt);
    // Enemies that crossed the bottom edge deal damage
    for (const m of this.meteors) {
      if (m.leaked && !m._leakApplied) {
        m._leakApplied = true;
        this.onEnemyLeaked(m);
      }
    }
    this.bullets=this.bullets.filter(x=>!x.dead);this.enemyBullets=this.enemyBullets.filter(x=>!x.dead);this.meteors=this.meteors.filter(x=>!x.dead);this.powerups=this.powerups.filter(x=>!x.dead);
    if(this.boss){this.boss.update(dt,this)}else this.spawnWave(dt);
    this.collisions();
    this.shake=Math.max(0,this.shake-dt*3);
    this.flash=Math.max(0,this.flash-dt*4);
    this.updateHud();
  }
  cloneOffset(){
    // Second ship sits to the side of the player
    const p = this.player;
    const side = 52 + Math.min(20, ((p.shipTier||1)-1)*4);
    return { x: Math.max(30, Math.min(innerWidth-30, p.x - side)), y: p.y + 6 };
  }
  shoot(){
    const p = this.player;
    const level = Math.min(5, p.weaponLevel + (p.overcharge > 0 ? 1 : 0));
    const w = this.weaponStats(level);
    let type = p.weaponType || "laser";
    // At max weapon level: fan covers full screen width from player position
    let angles;
    if (level >= 5 || !w.angles) {
      const reachY = Math.max(120, p.y - 40); // distance upward to cover
      const halfW = Math.max(p.x, innerWidth - p.x);
      const edge = Math.atan2(halfW, reachY); // angle to screen edge
      const n = 7;
      angles = [];
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        angles.push(-edge + t * 2 * edge);
      }
    } else {
      angles = w.angles.slice();
    }
    let speed = 620;
    let damage = 1 * w.dmgMul;
    let fireRate = (p.rapid > 0 ? 0.075 : 0.18) / w.rateMul;

    // Rebalanced DPS (approx equal at LV3, different roles)
    // Laser: baseline high RoF
    // Plasma: ~same DPS, fewer shots, high alpha
    // Spread: lower per-bullet, more coverage, slightly higher total DPS vs packs
    // Missile: lower RoF, high damage + homing (best vs elites/boss)
    if (type === "plasma") {
      speed = 440;
      damage = 2.1 * w.dmgMul;
      fireRate = (p.rapid > 0 ? 0.11 : 0.24) / w.rateMul;
      if (level >= 5) { /* keep full-screen angles */ }
      else if (level >= 4) angles = [-0.16, 0, 0.16];
      else if (level >= 2) angles = [-0.1, 0.1];
      else angles = [0];
    } else if (type === "spread") {
      speed = 560;
      damage = 0.95 * w.dmgMul;
      fireRate = (p.rapid > 0 ? 0.085 : 0.19) / w.rateMul;
      if (level < 5) {
        angles = angles.map(a => a * 1.35);
        if (level === 1) angles = [-0.14, 0.14];
      }
      // level 5: already full-screen fan
    } else if (type === "missile") {
      speed = 320;
      damage = 2.8 * w.dmgMul;
      fireRate = (p.rapid > 0 ? 0.15 : 0.32) / w.rateMul;
      if (level >= 5) { /* keep full-screen angles */ }
      else if (level >= 4) angles = [-0.18, 0, 0.18];
      else if (level >= 2) angles = [-0.1, 0.1];
      else angles = [0];
    }

    if (p.overcharge > 0) damage *= 1.5;

    const origins = [{ x: p.x, y: p.y }];
    if ((p.clone || 0) > 0) origins.push(this.cloneOffset());

    for (const origin of origins) {
      for (const a of angles) {
        const vx = Math.sin(a) * speed;
        const vy = -Math.cos(a) * speed;
        this.bullets.push(new Bullet(origin.x + Math.sin(a) * 6, origin.y - 18, vx, vy, damage, type));
        const flashColor = type === "plasma" ? "#c45cff" : type === "spread" ? "#ffd84d" : type === "missile" ? "#ff6b4a" : "#dffbff";
        this.particles.trail(origin.x + Math.sin(a) * 8, origin.y - 22, -Math.PI / 2 + a, flashColor, 3, 180);
      }
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
      // During clone: double enemy pressure
      if ((this.player.clone||0) > 0 && this.waveKills < this.waveTarget) {
        this.meteors.push(this.spawnEnemy());
      }
      let cd = Math.max(.22, .72-this.wave*.028);
      if ((this.player.clone||0) > 0) cd *= 0.55;
      this.spawnTimer = cd;
    }
  }
  spawnEnemy(){
    const w = this.wave;
    const aggro = this.aggression || 1;
    const roll = Math.random();
    // More aggressive enemies appear more often after bosses
    const eliteChance = 0.18 + Math.min(0.35, (this.bossesKilled || 0) * 0.08);
    if (w >= 3 && roll < eliteChance) return new Weaver(w, aggro);
    if (w >= 5 && roll < eliteChance + 0.15) return new ZigZag(w, aggro);
    if (w >= 7 && roll < eliteChance + 0.28) return new HomingDrone(w, aggro);
    if (w >= 4 && roll < 0.18) return new Weaver(w, aggro);
    if (w >= 6 && roll < 0.30) return new ZigZag(w, aggro);
    return new Meteor(w, aggro);
  }
  nextWave(){
    if(this.wave%5===0){this.startBoss();return}
    this.wave++;this.waveKills=0;this.waveTarget=7+this.wave*2;this.waveTimer=1.5;this.showMessage("WAVE "+this.wave);
    if(window.Sound) Sound.wave();
  }
  startBoss(){
    this.showMessage("⚠ BOSS APPROACHING ⚠");
    this.boss=new Boss(this.bossesKilled || 0);
    if(window.Sound) Sound.bossAppear();
  }
  bossDefeated(){
    const bx = this.boss ? this.boss.x : innerWidth/2;
    const by = this.boss ? this.boss.y : 125;
    this.score+=10000 + (this.bossesKilled || 0) * 2500;
    this.boss=null;
    this.bossesKilled = (this.bossesKilled || 0) + 1;
    // Soft-cap aggression: hard late game, still beatable toward boss 10
    // 0→1.00, 1→1.15, 5→1.75, 9→2.35, 10+→2.35
    this.aggression = Math.min(2.35, 1 + this.bossesKilled * 0.15);
    this.wave++;this.waveKills=0;this.waveTarget=7+this.wave*2;this.waveTimer=2.2;

    this.upgradeShipTierBase();

    this.particles.burst(bx, by, "#ff4f72", 60, 420, { size: 5, type: "circle" });
    this.particles.burst(bx, by, "#ff9a45", 40, 350, { size: 3 });
    this.particles.burst(bx, by, "#ffd84d", 25, 280, { type: "circle" });
    this.particles.ring(bx, by, "#ff4f72", 160);
    this.particles.ring(bx, by, "#ff9a45", 100);
    this.shake = 0.8;
    this.flash = 0.5;
    this.flashColor = "#ff4f72";
    if(window.Sound) Sound.bossDie();

    // Campaign clear: 10th boss = victory
    if (this.bossesKilled >= 10) {
      this.score += 50000;
      this.showMessage("SECTOR CLEARED");
      this.paused = true;
      this.awaitingUpgrade = false;
      // Brief celebration, then victory screen
      setTimeout(() => {
        if (this.won) return;
        this.end(true);
      }, 1600);
      return;
    }

    // Pause and open post-boss upgrade menu
    this.paused = true;
    this.awaitingUpgrade = true;
    if (window.ui && window.ui.showUpgradeMenu) window.ui.showUpgradeMenu(this);
  }
  upgradeShipTierBase(){
    const p = this.player;
    p.shipTier = (p.shipTier || 1) + 1;
    p.hp = p.maxHp;
    p.speed = 330 + (p.shipTier - 1) * 18;
    p.shield = Math.max(p.shield, 4);
    this.showMessage("SHIP TIER " + p.shipTier);
    this.particles.sparkle(p.x, p.y, "#53e8ff", 30);
    this.particles.sparkle(p.x, p.y, "#ffd84d", 18);
    this.particles.ring(p.x, p.y, "#53e8ff", 90);
    if (typeof AppStorage !== "undefined" && AppStorage.setBestShipTier) AppStorage.setBestShipTier(p.shipTier);
  }
  applyBossUpgrade(choice){
    const p = this.player;
    if (choice === "weapon") {
      if (!this.upgradeWeapon(true)) {
        p.overcharge = Math.max(p.overcharge, 12);
        this.showMessage("OVERCHARGE 12s");
      }
    } else if (choice === "armor") {
      if (!this.upgradeArmor()) {
        p.hp = p.maxHp;
        this.showMessage("FULL REPAIR");
      }
    } else if (choice === "plasma") {
      this.unlockWeaponType("plasma");
    } else if (choice === "spread") {
      this.unlockWeaponType("spread");
    } else if (choice === "missile") {
      this.unlockWeaponType("missile");
    } else if (choice === "clone") {
      p.clone = Math.max(p.clone || 0, 20);
      this.showMessage("DUAL SHIP 20s");
    } else if (choice === "shield") {
      p.shield = Math.max(p.shield, 12);
      this.showMessage("SHIELD 12s");
    } else if (choice === "rapid") {
      p.rapid = Math.max(p.rapid, 12);
      this.showMessage("RAPID 12s");
    }
    this.awaitingUpgrade = false;
    this.paused = false;
    this.last = performance.now();
    if (window.ui && window.ui.hideUpgradeMenu) window.ui.hideUpgradeMenu();
  }
  collisions(){
    const p=this.player;
    const ships = [{x:p.x,y:p.y,r:p.r}];
    if ((p.clone||0) > 0) {
      const c = this.cloneOffset();
      ships.push({x:c.x,y:c.y,r:p.r});
    }
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
    for(const eb of this.enemyBullets){
      for(const s of ships){
        if(Math.hypot(eb.x-s.x,eb.y-s.y)<s.r+eb.r){eb.dead=true;this.damage(eb.damage);break}
      }
    }
    for(const m of this.meteors){
      if(m.dead)continue;
      for(const s of ships){
        if(Math.hypot(m.x-s.x,m.y-s.y)<m.r+s.r){
          m.dead=true;
          const dmg = m.big ? 28 : (m.kind ? 22 : 18);
          this.damage(dmg);
          this.particles.burst(m.x,m.y, m.kind==="drone"?"#c45cff":"#9b7a92", 22, 200, {size:3});
          break;
        }
      }
    }
    for(const u of this.powerups){
      for(const s of ships){
        if(Math.hypot(u.x-s.x,u.y-s.y)<u.r+s.r){u.dead=true;this.applyPower(u.type);break}
      }
    }
  }
  destroyMeteor(m){
    m.dead=true;this.waveKills++;
    const pts = m.score || (m.big ? 450 : 120);
    this.score += pts;
    this.player.kills++;

    // Progression: weapon every 12 kills, armor every 15 kills
    this.addWeaponXP(this.enemyWeaponXP(m));
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
      const types=["overcharge","rapid","shield","repair","nova","weapon","plasma","spread","missile","armor","clone"];
      this.powerups.push(new PowerUp(m.x,m.y,types[Math.floor(Math.random()*types.length)]));
    }
  }
  onEnemyLeaked(m){
    const dmg = m.big ? 22 : (m.kind === "drone" ? 16 : m.kind ? 14 : 12);
    this.damage(dmg);
    this.flash = Math.max(this.flash, 0.25);
    this.flashColor = "#ff9a45";
    this.showMessage("BREACH!");
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
      if((this.bossesKilled||0)<1){
        p.overcharge=Math.max(p.overcharge,8);
        this.showMessage("OVERCHARGE");
      } else if(!this.upgradeWeapon()){
        p.overcharge=8;this.showMessage("OVERCHARGE");
      }
    }
    if(type==="plasma"){this.unlockWeaponType("plasma");}
    if(type==="spread"){this.unlockWeaponType("spread");}
    if(type==="missile"){this.unlockWeaponType("missile");}
    if(type==="clone"){
      p.clone = 20;
      this.showMessage("DUAL SHIP 20s");
      this.particles.sparkle(p.x, p.y, "#53e8ff", 28);
      this.particles.ring(p.x, p.y, "#53e8ff", 70);
    }
    if(type==="nova"){
      for(const m of this.meteors){m.hp=0;this.destroyMeteor(m)}
      for(const e of this.enemyBullets)e.dead=true;
      this.particles.burst(p.x,p.y,"#ff5cff",80,520,{type:"circle",size:4});
      this.particles.ring(p.x,p.y,"#ff5cff",140);
      this.shake=.5;
    }
    const sparkColor = type==="shield"?"#8d78ff":type==="repair"?"#4dff9b":type==="plasma"?"#c45cff":type==="missile"?"#ff6b4a":type==="clone"?"#53e8ff":type==="spread"?"#ffd84d":"#ffd84d";
    this.particles.sparkle(p.x, p.y, sparkColor, 18);
    if(!["weapon","plasma","spread","missile","armor","clone"].includes(type)) this.showMessage(type.toUpperCase());
    if(window.Sound) type === "shield" ? Sound.shield() : Sound.powerup();
  }
  end(win){
    this.running=false;this.won=win;cancelAnimationFrame(this.raf);if(this.score>AppStorage.getHighScore())AppStorage.setHighScore(this.score);if(typeof AppStorage.setBestShipTier==="function")AppStorage.setBestShipTier(this.player.shipTier||1);window.ui.showEnd(win,this.score,this.wave);
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
    this.drawOneShip(c, this.player.x, this.player.y, 1);
    if ((this.player.clone || 0) > 0) {
      const o = this.cloneOffset();
      this.drawOneShip(c, o.x, o.y, 0.75);
    }
  }
  drawOneShip(c, x, y, alpha){
    const p=this.player;
    const tier = p.shipTier || 1;
    c.save();c.translate(x,y);c.globalAlpha = alpha;
    const scale = 1 + Math.min(0.35, (tier - 1) * 0.07);
    c.scale(scale, scale);

    if(this.boost){
      c.fillStyle="#ff9d4d";c.shadowBlur=20;c.shadowColor="#ff9d4d";
      c.beginPath();c.moveTo(-7,15);c.lineTo(0,38+Math.random()*12);c.lineTo(7,15);c.fill();
      if(tier>=3){
        c.beginPath();c.moveTo(-14,12);c.lineTo(-10,28+Math.random()*8);c.lineTo(-6,12);c.fill();
        c.beginPath();c.moveTo(6,12);c.lineTo(10,28+Math.random()*8);c.lineTo(14,12);c.fill();
      }
    }

    const hullColors = ["#172944","#1a3558","#1e2a60","#2a1848","#142838"];
    const strokeColors = ["#53e8ff","#7ef9ff","#a0c4ff","#c45cff","#ffd84d"];
    const hi = Math.min(hullColors.length - 1, tier - 1);
    c.shadowBlur=22;c.shadowColor=strokeColors[hi];
    c.fillStyle=hullColors[hi];c.strokeStyle=strokeColors[hi];c.lineWidth=2;

    c.beginPath();c.moveTo(0,-25);c.lineTo(19,18);c.lineTo(7,13);c.lineTo(0,22);c.lineTo(-7,13);c.lineTo(-19,18);c.closePath();c.fill();c.stroke();

    if(tier>=2){
      c.beginPath();c.moveTo(-19,10);c.lineTo(-28-tier,16);c.lineTo(-14,18);c.closePath();c.fill();c.stroke();
      c.beginPath();c.moveTo(19,10);c.lineTo(28+tier,16);c.lineTo(14,18);c.closePath();c.fill();c.stroke();
    }
    if(tier>=4){
      c.strokeStyle="#ffd84d";c.lineWidth=1.5;
      c.beginPath();c.moveTo(-22,4);c.lineTo(-32,8);c.moveTo(22,4);c.lineTo(32,8);c.stroke();
      c.strokeStyle=strokeColors[hi];c.lineWidth=2;
    }

    if ((p.armorLevel || 1) >= 2) {
      c.strokeStyle = "#4dff9b";
      c.globalAlpha = alpha * (0.35 + (p.armorLevel - 1) * 0.08);
      c.lineWidth = 1.5 + (p.armorLevel - 1) * 0.4;
      c.beginPath();c.moveTo(0,-22);c.lineTo(16,15);c.lineTo(0,18);c.lineTo(-16,15);c.closePath();c.stroke();
      c.globalAlpha = alpha;
    }

    c.fillStyle="#dffbff";c.beginPath();c.ellipse(0,-7,7,11,0,0,Math.PI*2);c.fill();
    if(tier>=3){
      c.fillStyle="rgba(83,232,255,0.5)";
      c.fillRect(-10,6,20,3);
    }
    if(tier>=5){
      c.strokeStyle="#ffd84d";c.lineWidth=2;
      c.beginPath();c.moveTo(0,-25);c.lineTo(0,-36);c.stroke();
      c.fillStyle="#ffd84d";c.beginPath();c.arc(0,-36,2.5,0,Math.PI*2);c.fill();
    }

    if(p.shield>0){c.strokeStyle="#8d78ff";c.globalAlpha=alpha*(.7+.2*Math.sin(performance.now()/100));c.beginPath();c.arc(0,0,28+tier*2,0,Math.PI*2);c.stroke()}
    c.restore();
  }
  loop(t){if(!this.running)return;const dt=(t-this.last)/1000;this.last=t;this.update(dt);this.draw();this.raf=requestAnimationFrame(x=>this.loop(x))}
  start(){this.reset();this.raf=requestAnimationFrame(x=>this.loop(x))}
  togglePause(){if(!this.running||this.awaitingUpgrade)return;this.paused=!this.paused;window.ui.pause(this.paused);if(!this.paused)this.last=performance.now()}
}

class Bullet{
  constructor(x,y,vx=0,vy=-620,damage=1,type="laser"){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.damage=damage;this.type=type;this.dead=false;
    this.r = type==="plasma" ? 7 : type==="spread" ? 3.5 : type==="missile" ? 6 : 4;
    this.life = type==="missile" ? 2.5 : 99;
  }
  update(dt, game){
    if(this.type==="missile" && game){
      let best=null, bestD=180;
      for(const m of game.meteors){
        if(m.dead) continue;
        const d=Math.hypot(m.x-this.x,m.y-this.y);
        if(d<bestD){bestD=d;best=m;}
      }
      if(game.boss){
        const d=Math.hypot(game.boss.x-this.x,game.boss.y-this.y);
        if(d<bestD){bestD=d;best=game.boss;}
      }
      if(best){
        const a=Math.atan2(best.y-this.y,best.x-this.x);
        const speed=Math.hypot(this.vx,this.vy)||280;
        const turn=3.5*dt;
        const cur=Math.atan2(this.vy,this.vx);
        let diff=a-cur;
        while(diff>Math.PI) diff-=Math.PI*2;
        while(diff<-Math.PI) diff+=Math.PI*2;
        const na=cur+Math.max(-turn,Math.min(turn,diff));
        this.vx=Math.cos(na)*speed;
        this.vy=Math.sin(na)*speed;
      }
      this.life-=dt;
      if(this.life<=0) this.dead=true;
    }
    this.x+=this.vx*dt;this.y+=this.vy*dt;
    if(this.y<-40||this.x<-40||this.x>innerWidth+40)this.dead=true;
  }
  draw(ctx){
    ctx.save();
    if(this.type==="plasma"){
      ctx.shadowBlur=20;ctx.shadowColor="#c45cff";
      ctx.fillStyle="#e8a0ff";
      ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(this.x,this.y,this.r*0.4,0,Math.PI*2);ctx.fill();
    } else if(this.type==="spread"){
      ctx.shadowBlur=12;ctx.shadowColor="#ff9d4d";
      ctx.fillStyle="#ffd84d";
      ctx.beginPath();ctx.moveTo(this.x,this.y-8);ctx.lineTo(this.x+3,this.y+6);ctx.lineTo(this.x-3,this.y+6);ctx.closePath();ctx.fill();
    } else if(this.type==="missile"){
      ctx.shadowBlur=14;ctx.shadowColor="#ff6b4a";
      const ang=Math.atan2(this.vy,this.vx);
      ctx.translate(this.x,this.y);ctx.rotate(ang+Math.PI/2);
      ctx.fillStyle="#ff8a65";
      ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(4,6);ctx.lineTo(0,4);ctx.lineTo(-4,6);ctx.closePath();ctx.fill();
      ctx.fillStyle="#ffd84d";ctx.fillRect(-1.5,4,3,5);
    } else {
      ctx.shadowBlur=15;ctx.shadowColor="#53e8ff";
      ctx.fillStyle="#dffbff";ctx.fillRect(this.x-2,this.y-12,4,16);
    }
    ctx.restore();
  }
}
class EnemyBullet{
  constructor(x,y,vx,vy,damage=12){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.damage=damage;this.r=6;this.dead=false}
  update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.y>innerHeight+40||this.x<-40||this.x>innerWidth+40)this.dead=true}
  draw(ctx){ctx.save();ctx.shadowBlur=14;ctx.shadowColor="#ff4f72";ctx.fillStyle="#ff7b91";ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();ctx.restore()}
}
// Basic alien ship (replaces meteors) — slight drift, alien design
class AlienShip {
  constructor(wave) {
    const big = Math.random() < 0.14;
    this.big = big;
    this.r = big ? 26 + Math.random() * 10 : 12 + Math.random() * 6;
    this.x = this.r + Math.random() * (innerWidth - this.r * 2);
    this.y = -this.r - 15;
    this.vx = (Math.random() - 0.5) * (40 + wave * 5);
    this.vy = 55 + Math.random() * 50 + wave * 6;
    this.hp = big ? 5 + Math.floor(wave / 3) : 1 + Math.floor(wave / 7);
    this.maxHp = this.hp;
    this.dead = false;
    this.t = 0;
    this.kind = big ? "cruiser" : "fighter";
    this.score = big ? 450 : 120;
    this.variant = Math.floor(Math.random() * 3); // visual variety
  }
  update(dt) {
    this.t += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // gentle sine drift
    this.x += Math.sin(this.t * 1.5) * 12 * dt;
    if (this.x < -50) this.x = innerWidth + 50;
    if (this.x > innerWidth + 50) this.x = -50;
    if (this.y > innerHeight + 60) this.dead = true;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = 1 + Math.sin(this.t * 4) * 0.04;
    ctx.scale(pulse, pulse);
    if (this.big) {
      // Cruiser — wide alien mothership chunk
      ctx.shadowBlur = 22;
      ctx.shadowColor = "#ff4f72";
      ctx.fillStyle = "#3a1528";
      ctx.strokeStyle = "#ff6b8a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-this.r * 1.1, 0);
      ctx.lineTo(-this.r * 0.7, -this.r * 0.55);
      ctx.lineTo(-this.r * 0.2, -this.r * 0.75);
      ctx.lineTo(this.r * 0.2, -this.r * 0.75);
      ctx.lineTo(this.r * 0.7, -this.r * 0.55);
      ctx.lineTo(this.r * 1.1, 0);
      ctx.lineTo(this.r * 0.5, this.r * 0.5);
      ctx.lineTo(0, this.r * 0.35);
      ctx.lineTo(-this.r * 0.5, this.r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // lights
      ctx.fillStyle = "#ff4f72";
      for (const ox of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.arc(this.r * ox, -this.r * 0.25, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#53e8ff";
      ctx.fillRect(-8, 2, 16, 5);
    } else {
      // Small fighter variants
      ctx.shadowBlur = 14;
      const colors = [
        { fill: "#1a3048", stroke: "#5ad0ff", core: "#7ef9ff" },
        { fill: "#2a1840", stroke: "#c45cff", core: "#e8a0ff" },
        { fill: "#1a3828", stroke: "#4dff9b", core: "#9bffc8" }
      ];
      const c = colors[this.variant];
      ctx.shadowColor = c.stroke;
      ctx.fillStyle = c.fill;
      ctx.strokeStyle = c.stroke;
      ctx.lineWidth = 2;
      if (this.variant === 0) {
        // diamond
        ctx.beginPath();
        ctx.moveTo(0, -this.r);
        ctx.lineTo(this.r * 0.9, 0);
        ctx.lineTo(0, this.r * 0.7);
        ctx.lineTo(-this.r * 0.9, 0);
        ctx.closePath();
      } else if (this.variant === 1) {
        // saucer
        ctx.beginPath();
        ctx.ellipse(0, 0, this.r, this.r * 0.55, 0, 0, Math.PI * 2);
        ctx.moveTo(-this.r * 0.5, 0);
        ctx.lineTo(0, -this.r * 0.9);
        ctx.lineTo(this.r * 0.5, 0);
      } else {
        // claw
        ctx.beginPath();
        ctx.moveTo(0, this.r * 0.6);
        ctx.lineTo(-this.r, -this.r * 0.3);
        ctx.lineTo(-this.r * 0.3, -this.r * 0.8);
        ctx.lineTo(0, -this.r * 0.4);
        ctx.lineTo(this.r * 0.3, -this.r * 0.8);
        ctx.lineTo(this.r, -this.r * 0.3);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = c.core;
      ctx.beginPath();
      ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
// Keep name Meteor as alias so old references still work
const Meteor = AlienShip;
// Sine-wave weaver — oscillates left-right while descending
class Weaver {
  constructor(wave) {
    this.r = 14 + Math.random() * 4;
    this.baseX = this.r + 40 + Math.random() * (innerWidth - this.r * 2 - 80);
    this.x = this.baseX;
    this.y = -this.r - 20;
    this.amp = 40 + Math.random() * 50 + wave * 2;
    this.freq = 1.8 + Math.random() * 1.4;
    this.phase = Math.random() * Math.PI * 2;
    this.vy = 70 + Math.random() * 40 + wave * 5;
    this.hp = 2 + Math.floor(wave / 5);
    this.maxHp = this.hp;
    this.dead = false;
    this.t = 0;
    this.kind = "weaver";
    this.score = 180;
  }
  update(dt) {
    this.t += dt;
    this.y += this.vy * dt;
    this.x = this.baseX + Math.sin(this.t * this.freq + this.phase) * this.amp;
    if (this.y > innerHeight + 40) this.dead = true;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#53e8ff";
    // Body
    ctx.fillStyle = "#1a3a55";
    ctx.strokeStyle = "#53e8ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(14, 8);
    ctx.lineTo(6, 4);
    ctx.lineTo(0, 12);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Cockpit
    ctx.fillStyle = "#7ef9ff";
    ctx.beginPath();
    ctx.ellipse(0, -4, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wings glow
    ctx.strokeStyle = "rgba(83,232,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.lineTo(-22, 14);
    ctx.moveTo(14, 8);
    ctx.lineTo(22, 14);
    ctx.stroke();
    ctx.restore();
  }
}

// Zig-zag fighter — changes horizontal direction periodically
class ZigZag {
  constructor(wave) {
    this.r = 15;
    this.x = 30 + Math.random() * (innerWidth - 60);
    this.y = -30;
    this.vx = (Math.random() < 0.5 ? 1 : -1) * (120 + wave * 8);
    this.vy = 55 + Math.random() * 35 + wave * 4;
    this.switchTimer = 0.4 + Math.random() * 0.5;
    this.hp = 3 + Math.floor(wave / 4);
    this.maxHp = this.hp;
    this.dead = false;
    this.t = 0;
    this.kind = "zigzag";
    this.score = 220;
  }
  update(dt) {
    this.t += dt;
    this.switchTimer -= dt;
    if (this.switchTimer <= 0) {
      this.vx *= -1;
      this.switchTimer = 0.35 + Math.random() * 0.55;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 20) { this.x = 20; this.vx = Math.abs(this.vx); }
    if (this.x > innerWidth - 20) { this.x = innerWidth - 20; this.vx = -Math.abs(this.vx); }
    if (this.y > innerHeight + 40) this.dead = true;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const tilt = Math.sin(this.t * 8) * 0.15;
    ctx.rotate(tilt);
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#ff9d4d";
    ctx.fillStyle = "#4a2a18";
    ctx.strokeStyle = "#ff9d4d";
    ctx.lineWidth = 2;
    // Angular fighter shape
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, -4);
    ctx.lineTo(12, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-16, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffb86c";
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Homing drone — smoothly curves toward player while descending, occasional shot
class HomingDrone {
  constructor(wave) {
    this.r = 13;
    this.x = 40 + Math.random() * (innerWidth - 80);
    this.y = -25;
    this.vx = 0;
    this.vy = 50 + Math.random() * 30 + wave * 3;
    this.hp = 2 + Math.floor(wave / 6);
    this.maxHp = this.hp;
    this.dead = false;
    this.t = 0;
    this.shotTimer = 1.2 + Math.random();
    this.kind = "drone";
    this.score = 250;
    this.turnSpeed = 90 + wave * 5;
  }
  update(dt, game) {
    this.t += dt;
    if (game && game.player) {
      const dx = game.player.x - this.x;
      const targetVx = Math.max(-160, Math.min(160, dx * 1.1));
      // Smooth steering
      this.vx += (targetVx - this.vx) * Math.min(1, dt * 2.5);
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(20, Math.min(innerWidth - 20, this.x));

    this.shotTimer -= dt;
    if (this.shotTimer <= 0 && game && this.y > 40 && this.y < innerHeight * 0.7) {
      const a = Math.atan2(game.player.y - this.y, game.player.x - this.x);
      game.enemyBullets.push(new EnemyBullet(this.x, this.y + 10, Math.cos(a) * 160, Math.sin(a) * 160, 10));
      this.shotTimer = 1.8 + Math.random() * 1.2;
    }
    if (this.y > innerHeight + 40) this.dead = true;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#c45cff";
    // Hex-ish body
    ctx.fillStyle = "#2a1540";
    ctx.strokeStyle = "#c45cff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * this.r;
      const py = Math.sin(a) * this.r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Core
    ctx.fillStyle = "#e8a0ff";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Eye direction hint
    ctx.fillStyle = "#ff4f72";
    ctx.beginPath();
    ctx.arc(0, 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class PowerUp{
  constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.r=13;this.vy=55;this.dead=false;this.t=0}
  update(dt){this.y+=this.vy*dt;this.t+=dt;if(this.y>innerHeight+30)this.dead=true}
  draw(ctx){
    const colors={overcharge:"#ff9d4d",rapid:"#53e8ff",shield:"#8d78ff",repair:"#4dff9b",nova:"#ff5cff",weapon:"#ffd84d",plasma:"#c45cff",spread:"#ffb86c",missile:"#ff6b4a",armor:"#7cffb2"};
    const icons={overcharge:"⚡",rapid:"R",shield:"S",repair:"+",nova:"N",weapon:"W",plasma:"P",spread:"X",missile:"M",armor:"A"};
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.sin(this.t*4)*.15);ctx.shadowBlur=18;ctx.shadowColor=colors[this.type];ctx.strokeStyle=colors[this.type];ctx.fillStyle="rgba(10,15,30,.9)";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,this.r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=colors[this.type];ctx.font="bold 14px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(icons[this.type],0,1);ctx.restore();
  }
}
class Boss{
  constructor(){this.x=innerWidth/2;this.y=-120;this.r=74;this.hp=220;this.maxHp=220;this.dead=false;this.t=0;this.shotTimer=1;this.phase=1}
  update(dt,game){
    this.t+=dt;
    this.y=Math.min(125,this.y+100*dt);
    this.x=innerWidth/2+Math.sin(this.t*.7)*Math.min(260,innerWidth*.32);
    this.phase=this.hp<75?3:this.hp<145?2:1;
    this.shotTimer-=dt;
    if(this.shotTimer<=0){this.shoot(game);this.shotTimer=this.phase===3?.45:this.phase===2?.75:1.05}
  }
  shoot(game){
    const base=Math.atan2(game.player.y-this.y,game.player.x-this.x);
    const count=this.phase===1?3:this.phase===2?5:7;
    const spread=this.phase===3?.65:.45;
    for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*(spread/(count-1||1));game.enemyBullets.push(new EnemyBullet(this.x,this.y+45,Math.cos(a)*180,Math.sin(a)*180,18))}
  }
  draw(ctx){
    ctx.save();ctx.translate(this.x,this.y);ctx.shadowBlur=35;ctx.shadowColor="#ff4f72";
    ctx.fillStyle="#261a34";ctx.strokeStyle="#ff5b7d";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-72,30);ctx.lineTo(-48,-42);ctx.lineTo(-20,-58);ctx.lineTo(0,-38);ctx.lineTo(20,-58);ctx.lineTo(48,-42);ctx.lineTo(72,30);ctx.lineTo(35,18);ctx.lineTo(0,55);ctx.lineTo(-35,18);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#ff596f";for(const x of [-28,28]){ctx.beginPath();ctx.arc(x,-18,9,0,Math.PI*2);ctx.fill()}
    ctx.fillStyle="#53e8ff";ctx.fillRect(-16,-2,32,8);ctx.restore();
  }
}

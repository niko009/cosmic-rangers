class Game{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext("2d");this.resize();
    this.stars=new Starfield();this.particles=new ParticleSystem();
    this.player={x:innerWidth/2,y:innerHeight-100,r:18,hp:100,maxHp:100,speed:330,fire:0,rapid:0,overcharge:0,shield:0};
    this.bullets=[];this.enemyBullets=[];this.meteors=[];this.powerups=[];this.boss=null;
    this.score=0;this.wave=1;this.waveKills=0;this.waveTarget=8;this.waveTimer=1.5;
    this.spawnTimer=0;this.running=false;this.paused=false;this.won=false;this.shake=0;this.boost=false;
    this.keys={};this.last=0;
    addEventListener("resize",()=>this.resize());
  }
  resize(){this.canvas.width=innerWidth*devicePixelRatio;this.canvas.height=innerHeight*devicePixelRatio;this.ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);if(this.player)this.player.y=Math.min(innerHeight-80,this.player.y)}
  reset(){
    this.player={x:innerWidth/2,y:innerHeight-100,r:18,hp:100,maxHp:100,speed:330,fire:0,rapid:0,overcharge:0,shield:0};
    this.bullets=[];this.enemyBullets=[];this.meteors=[];this.powerups=[];this.boss=null;this.score=0;this.wave=1;this.waveKills=0;this.waveTarget=8;this.waveTimer=1.5;this.spawnTimer=.3;this.shake=0;this.running=true;this.paused=false;this.won=false;this.last=performance.now();
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
    const firing=this.keys.Space||this.touchFire;
    p.fire-=dt;
    if(firing&&p.fire<=0)this.shoot();
    for(const b of this.bullets)b.update(dt);
    for(const b of this.enemyBullets)b.update(dt);
    for(const m of this.meteors)m.update(dt);
    for(const u of this.powerups)u.update(dt);
    this.bullets=this.bullets.filter(x=>!x.dead);this.enemyBullets=this.enemyBullets.filter(x=>!x.dead);this.meteors=this.meteors.filter(x=>!x.dead);this.powerups=this.powerups.filter(x=>!x.dead);
    if(this.boss){this.boss.update(dt,this)}else this.spawnWave(dt);
    this.collisions();
    this.shake=Math.max(0,this.shake-dt*3);
    this.updateHud();
  }
  shoot(){
    const p=this.player, triple=p.overcharge>0;
    const damage=p.overcharge>0?2:1;
    const shots=triple?[-.22,0,.22]:[0];
    for(const a of shots)this.bullets.push(new Bullet(p.x,p.y-20,Math.sin(a)*500,-Math.cos(a)*500,damage));
    p.fire=p.rapid>0?.075:.18;
  }
  spawnWave(dt){
    if(this.waveTimer>0){this.waveTimer-=dt;return}
    this.spawnTimer-=dt;
    if(this.waveKills>=this.waveTarget&&this.meteors.length===0){this.nextWave();return}
    if(this.spawnTimer<=0&&this.waveKills<this.waveTarget){
      this.meteors.push(new Meteor(this.wave));this.spawnTimer=Math.max(.25, .75-this.wave*.025);
    }
  }
  nextWave(){
    if(this.wave%5===0){this.startBoss();return}
    this.wave++;this.waveKills=0;this.waveTarget=7+this.wave*2;this.waveTimer=1.5;this.showMessage("WAVE "+this.wave);
  }
  startBoss(){
    this.showMessage("⚠ BOSS APPROACHING ⚠");this.boss=new Boss();
  }
  bossDefeated(){
    this.score+=10000;this.boss=null;this.wave++;this.waveKills=0;this.waveTarget=7+this.wave*2;this.waveTimer=2;this.showMessage("BOSS DESTROYED");this.particles.burst(innerWidth/2,125,"#ff4f72",100,500);
  }
  collisions(){
    const p=this.player;
    for(const b of this.bullets){
      for(const m of this.meteors){
        if(m.dead)continue;
        if(Math.hypot(b.x-m.x,b.y-m.y)<m.r+5){b.dead=true;m.hp-=b.damage;this.particles.burst(b.x,b.y,"#ffd84d",5,100);if(m.hp<=0)this.destroyMeteor(m);break}
      }
      if(this.boss&&!b.dead&&Math.hypot(b.x-this.boss.x,b.y-this.boss.y)<this.boss.r){b.dead=true;this.boss.hp-=b.damage;this.particles.burst(b.x,b.y,"#ff5b7d",3,90);if(this.boss.hp<=0)this.bossDefeated()}
    }
    for(const eb of this.enemyBullets){if(Math.hypot(eb.x-p.x,eb.y-p.y)<p.r+eb.r){eb.dead=true;this.damage(eb.damage)}}
    for(const m of this.meteors){if(Math.hypot(m.x-p.x,m.y-p.y)<m.r+p.r){m.dead=true;this.damage(m.big?28:18);this.particles.burst(m.x,m.y,"#9b7a92",20,180)}}
    for(const u of this.powerups){if(Math.hypot(u.x-p.x,u.y-p.y)<u.r+p.r){u.dead=true;this.applyPower(u.type)}}
  }
  destroyMeteor(m){
    m.dead=true;this.waveKills++;this.score+=m.big?500:100;this.particles.burst(m.x,m.y,m.big?"#ff9d4d":"#aaa0ba",m.big?28:15,m.big?250:170);
    if(Math.random()<.16){const types=["overcharge","rapid","shield","repair","nova"];this.powerups.push(new PowerUp(m.x,m.y,types[Math.floor(Math.random()*types.length)]))}
  }
  damage(amount){
    if(this.player.shield>0)return;
    this.player.hp-=amount;this.shake=.3;this.particles.burst(this.player.x,this.player.y,"#ff4f72",12,180);
    if(this.player.hp<=0)this.end(false);
  }
  applyPower(type){
    const p=this.player;
    if(type==="overcharge")p.overcharge=10;
    if(type==="rapid")p.rapid=10;
    if(type==="shield")p.shield=10;
    if(type==="repair")p.hp=Math.min(p.maxHp,p.hp+35);
    if(type==="nova"){for(const m of this.meteors){m.hp=0;this.destroyMeteor(m)}for(const e of this.enemyBullets)e.dead=true;this.particles.burst(p.x,p.y,"#ff5cff",70,500)}
    this.showMessage(type.toUpperCase());
  }
  end(win){
    this.running=false;this.won=win;cancelAnimationFrame(this.raf);if(this.score>AppStorage.getHighScore())AppStorage.setHighScore(this.score);window.ui.showEnd(win,this.score,this.wave);
  }
  showMessage(text){
    const el=document.getElementById("waveMessage");el.textContent=text;el.classList.add("show");clearTimeout(this.msgTimer);this.msgTimer=setTimeout(()=>el.classList.remove("show"),1200);
  }
  updateHud(){window.ui.updateHud(this)}
  draw(){
    const c=this.ctx;c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);c.clearRect(0,0,innerWidth,innerHeight);
    c.fillStyle="#03050d";c.fillRect(0,0,innerWidth,innerHeight);this.stars.draw(c);
    c.save();if(this.shake>0)c.translate((Math.random()-.5)*this.shake*16,(Math.random()-.5)*this.shake*16);
    for(const m of this.meteors)m.draw(c);for(const u of this.powerups)u.draw(c);for(const b of this.bullets)b.draw(c);for(const b of this.enemyBullets)b.draw(c);if(this.boss)this.boss.draw(c);this.drawPlayer(c);this.particles.draw(c);c.restore();
  }
  drawPlayer(c){
    const p=this.player;c.save();c.translate(p.x,p.y);if(this.boost){c.fillStyle="#ff9d4d";c.shadowBlur=20;c.shadowColor="#ff9d4d";c.beginPath();c.moveTo(-7,15);c.lineTo(0,38+Math.random()*12);c.lineTo(7,15);c.fill()}
    c.shadowBlur=22;c.shadowColor="#53e8ff";c.fillStyle="#172944";c.strokeStyle="#53e8ff";c.lineWidth=2;
    c.beginPath();c.moveTo(0,-25);c.lineTo(19,18);c.lineTo(7,13);c.lineTo(0,22);c.lineTo(-7,13);c.lineTo(-19,18);c.closePath();c.fill();c.stroke();
    c.fillStyle="#dffbff";c.beginPath();c.ellipse(0,-7,7,11,0,0,Math.PI*2);c.fill();
    if(p.shield>0){c.strokeStyle="#8d78ff";c.globalAlpha=.7+.2*Math.sin(performance.now()/100);c.beginPath();c.arc(0,0,30,0,Math.PI*2);c.stroke()}
    c.restore();
  }
  loop(t){if(!this.running)return;const dt=(t-this.last)/1000;this.last=t;this.update(dt);this.draw();this.raf=requestAnimationFrame(x=>this.loop(x))}
  start(){this.reset();this.raf=requestAnimationFrame(x=>this.loop(x))}
  togglePause(){if(!this.running)return;this.paused=!this.paused;window.ui.pause(this.paused);if(!this.paused)this.last=performance.now()}
}

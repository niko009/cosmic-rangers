class Bullet{
  constructor(x,y,vx=0,vy=-620,damage=1){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.damage=damage;this.r=4;this.dead=false}
  update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.y<-30)this.dead=true}
  draw(ctx){ctx.save();ctx.shadowBlur=15;ctx.shadowColor="#53e8ff";ctx.fillStyle="#dffbff";ctx.fillRect(this.x-2,this.y-12,4,16);ctx.restore()}
}
class EnemyBullet{
  constructor(x,y,vx,vy,damage=12){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.damage=damage;this.r=6;this.dead=false}
  update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.y>innerHeight+40||this.x<-40||this.x>innerWidth+40)this.dead=true}
  draw(ctx){ctx.save();ctx.shadowBlur=14;ctx.shadowColor="#ff4f72";ctx.fillStyle="#ff7b91";ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();ctx.restore()}
}
class Meteor{
  constructor(wave){
    const big=Math.random()<.16;
    this.r=big?28+Math.random()*13:13+Math.random()*10;
    this.x=this.r+Math.random()*(innerWidth-this.r*2);
    this.y=-this.r-10;
    this.vx=(Math.random()-.5)*(30+wave*4);
    this.vy=65+Math.random()*65+wave*7;
    this.hp=big?4+Math.floor(wave/3):1+Math.floor(wave/8);
    this.maxHp=this.hp;this.dead=false;this.rot=Math.random()*6.28;this.spin=(Math.random()-.5)*2;
    this.big=big;
    this.verts=[];
    const n=8;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2, rr=this.r*(.78+Math.random()*.28);
      this.verts.push([Math.cos(a)*rr, Math.sin(a)*rr]);
    }
  }
  update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.rot+=this.spin*dt;if(this.x<-50)this.x=innerWidth+50;if(this.x>innerWidth+50)this.x=-50;if(this.y>innerHeight+60)this.dead=true}
  draw(ctx){
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.rot);
    ctx.fillStyle=this.big?"#746b80":"#665e72";ctx.strokeStyle="#aaa0ba";ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<this.verts.length;i++){
      const [x,y]=this.verts[i];
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.arc(-this.r*.25,-this.r*.1,this.r*.2,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}
class PowerUp{
  constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.r=13;this.vy=55;this.dead=false;this.t=0}
  update(dt){this.y+=this.vy*dt;this.t+=dt;if(this.y>innerHeight+30)this.dead=true}
  draw(ctx){
    const colors={overcharge:"#ff9d4d",rapid:"#53e8ff",shield:"#8d78ff",repair:"#4dff9b",nova:"#ff5cff"};
    const icons={overcharge:"⚡",rapid:"R",shield:"S",repair:"+",nova:"N"};
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

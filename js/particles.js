class ParticleSystem{
  constructor(){this.items=[]}
  burst(x,y,color,count=18,speed=160){
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2, s=Math.random()*speed+30;
      this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45+Math.random()*.5,max:.9,size:2+Math.random()*3,color});
    }
  }
  update(dt){
    for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;p.life-=dt}
    this.items=this.items.filter(p=>p.life>0);
  }
  draw(ctx){
    for(const p of this.items){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}
    ctx.globalAlpha=1;
  }
}

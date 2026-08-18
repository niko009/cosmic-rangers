class Starfield{
  constructor(){this.stars=[];this.resize()}
  resize(){
    const n=Math.min(180,Math.floor(innerWidth*innerHeight/7000));
    this.stars=Array.from({length:n},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,z:.2+Math.random()*.9,s:Math.random()*1.8+.3}));
  }
  update(dt,boost=1){for(const s of this.stars){s.y+=(20+70*s.z)*dt*boost;if(s.y>innerHeight+5){s.y=-5;s.x=Math.random()*innerWidth}}}
  draw(ctx){ctx.fillStyle="#fff";for(const s of this.stars){ctx.globalAlpha=.2+.65*s.z;ctx.fillRect(s.x,s.y,s.s,s.s)}ctx.globalAlpha=1}
}

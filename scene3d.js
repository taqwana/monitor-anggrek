// Tampilan 3D kebun anggrek (three.js). Dimuat saat tombol "3D" ditekan.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const KA=window.KA,V=(x,y,z)=>new THREE.Vector3(x,y,z),cx=x=>(x-1090)/100,cz=y=>(y-840)/100;
const w3=p=>V(cx(p[0]),0,cz(p[1]));
const mat=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o));
const SY=[337,481,626,770];
const LOOK={owner:['#2e7d4f','#f2d16b','Petani'],mandor:['#e0952a','#f5c518','Mandor'],penyiram:['#2f7fb5','#ffffff','Penyiram'],teknisi:['#c2372b','#555555','Teknisi']};
let scene,camera,renderer,controls,el,raf=0,clock,rain=false,cloud,rainP,tank,mainPipe;
const ch={},zn=[],sens={},bub={},bt={};

function add(m,x,y,z,par){m.position.set(x,y,z);(par||scene).add(m);return m;}
function box(w,h,d,c,x,y,z,par){return add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c)),x,y,z,par);}
function ball(r,c,x,y,z,par){return add(new THREE.Mesh(new THREE.SphereGeometry(r,12,10),mat(c)),x,y,z,par);}
function label(t,sc,x,y,z,par){
  const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
  g.fillStyle='rgba(255,255,255,.92)';g.fillRect(0,8,256,48);g.strokeStyle='#23312b';g.lineWidth=3;g.strokeRect(1,8,254,48);
  g.fillStyle='#23312b';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText(t,128,44);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));
  s.scale.set(2*sc,.5*sc,1);s.renderOrder=10;return add(s,x,y,z,par);
}
function pipe(a,b){
  const d=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,d.length(),8),mat('#3a8ae0'));
  m.position.copy(a).add(b).multiplyScalar(.5);
  if(Math.abs(d.z)>Math.abs(d.x))m.rotation.x=Math.PI/2;else m.rotation.z=Math.PI/2;
  scene.add(m);return m;
}
function limb(g,w,h,c,x,y){const pv=new THREE.Group();pv.position.set(x,y,0);box(w,h,w,c,0,-h/2,0,pv);g.add(pv);return pv;}
function person(k){
  const [c,hc,name]=LOOK[k],g=new THREE.Group();
  box(.5,.6,.3,c,0,.85,0,g);ball(.2,'#f1c9a0',0,1.4,0,g);
  const hat=k==='owner'?new THREE.Mesh(new THREE.ConeGeometry(.42,.25,12),mat(hc)):new THREE.Mesh(new THREE.SphereGeometry(.23,12,8,0,6.29,0,1.6),mat(hc));
  add(hat,0,k==='owner'?1.64:1.46,0,g);
  const o={g,ph:0,target:null,lL:limb(g,.18,.5,'#34495e',-.13,.55),lR:limb(g,.18,.5,'#34495e',.13,.55),aL:limb(g,.14,.5,c,-.35,1.12),aR:limb(g,.14,.5,c,.35,1.12)};
  label(name,.7,0,2.0,0,g);
  scene.add(g);
  const b=document.createElement('div');b.className='b3';el.append(b);bub[k]=b;
  return o;
}
function build(){
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(26,20),mat('#d6e3cb'));gnd.rotation.x=-Math.PI/2;scene.add(gnd);
  box(19.3,.25,7.4,'#8b6b4a',0,.125,-3.1);
  mainPipe=pipe(V(cx(546),.2,cz(1315)),V(cx(1946),.2,cz(1315)));
  for(let i=0;i<KA.N;i++){
    const x=cx(KA.X[i]),p=pipe(V(x,.2,cz(270)),V(x,.2,cz(1315)));
    SY.forEach(y=>{
      const z=cz(y);add(new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.3,8),mat('#86b4ea')),x,.35,z);
      [-.5,.5].forEach((o,j)=>{box(.06,.4,.06,'#3f7d3a',x+o,.45,z);ball(.14,j?'#b0357c':'#f4eaf2',x+o,.75,z);});
    });
    const zb=box(1.42,.6,.9,'#bfe6d6',x,.3,cz(1062));label('Z'+(i+1),.6,x,1.0,cz(1062));
    const vel=[];for(let k=0;k<SY.length*14;k++){const a=Math.random()*6.28,r=.8+Math.random()*.8;vel.push([Math.cos(a)*r,3.2+Math.random()*1.4,Math.sin(a)*r]);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(vel.length*3),3));
    const pts=new THREE.Points(g,new THREE.PointsMaterial({color:'#4cc3f0',size:.14}));pts.visible=false;pts.frustumCulled=false;scene.add(pts);
    zn.push({x,pipe:p,box:zb,pts,vel,on:false});
  }
  box(3.72,1.3,1.8,'#e8c9a0',cx(314),.65,cz(1062));box(3.9,.15,2,'#7a4a10',cx(314),1.38,cz(1062));label('Panel kontrol',.9,cx(314),2.1,cz(1062));
  tank=add(new THREE.Mesh(new THREE.CylinderGeometry(1,1,1.4,16),mat('#9ec4ea')),cx(337),.7,cz(1316));label('Tandon + pompa',.9,cx(337),1.9,cz(1316));
  const nm={tanah:'Tanah',dht:'DHT',hujan:'Hujan'};
  for(const k in nm){const p=w3(KA.POS.sensor[k]);box(.08,.7,.08,'#555555',p.x,.35,p.z);
    const head=box(.5,.35,.35,'#9b8be0',p.x,.85,p.z);label(nm[k],.6,p.x,1.45,p.z);sens[k]={head,x:p.x,bad:false,type:''};}
  cloud=new THREE.Group();[[0,0],[1.6,.3],[-1.6,.2],[.8,-.9],[-.8,-.8]].forEach(q=>ball(1.2,'#9aa7b0',q[0],0,q[1],cloud));
  cloud.position.set(0,6.5,-1);cloud.visible=false;scene.add(cloud);
  const rp=new Float32Array(240*3);for(let i=0;i<240;i++){rp[i*3]=(Math.random()-.5)*18;rp[i*3+1]=Math.random()*6.5;rp[i*3+2]=(Math.random()-.5)*10-1;}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));
  rainP=new THREE.Points(rg,new THREE.PointsMaterial({color:'#6fa8d6',size:.1}));rainP.visible=false;rainP.frustumCulled=false;scene.add(rainP);
  const s=KA.snapshot();
  for(const k in LOOK){ch[k]=person(k);ch[k].g.position.copy(w3(s.pos[k]));}
}
function setZ(n,on){
  const z=zn[n-1];if(!z)return;z.on=!!on;
  z.box.material.color.set(on?'#ffd978':'#bfe6d6');z.box.material.emissive.set(on?'#b8741a':'#000000');
  z.pipe.material.color.set(on?'#14b4e8':'#3a8ae0');z.pts.visible=!!on;
  const any=zn.some(q=>q.on);tank.material.emissive.set(any?'#2f7fb5':'#000000');mainPipe.material.color.set(any?'#14b4e8':'#3a8ae0');
}
function update(dt,t){
  for(const k in ch){const c=ch[k];
    if(c.target){const d=c.target.clone().sub(c.g.position);d.y=0;const L=d.length();
      if(L<.06)c.target=null;else{c.g.rotation.y=Math.atan2(d.x,d.z);c.g.position.add(d.multiplyScalar(Math.min(L,6*dt)/L));c.ph+=dt*11;}}
    const sw=c.target?Math.sin(c.ph)*.7:0;
    c.lL.rotation.x=sw;c.lR.rotation.x=-sw;c.aL.rotation.x=-sw;c.aR.rotation.x=sw;
    c.g.position.y=c.target?Math.abs(Math.sin(c.ph))*.06:0;}
  zn.forEach(z=>{if(!z.on)return;const a=z.pts.geometry.attributes.position;
    for(let i=0;i<a.count;i++){const s=Math.floor(i/14),tt=(t*1.1+i*.137)%.8,v=z.vel[i];
      a.setXYZ(i,z.x+v[0]*tt,.35+v[1]*tt-5*tt*tt,cz(SY[s])+v[2]*tt);}
    a.needsUpdate=true;});
  cloud.visible=rainP.visible=rain;
  if(rain){const a=rainP.geometry.attributes.position.array;for(let i=1;i<a.length;i+=3){a[i]-=9*dt;if(a[i]<0)a[i]=6.5;}rainP.geometry.attributes.position.needsUpdate=true;}
  for(const k in sens){const s=sens[k];
    if(s.bad){s.head.material.color.set(s.type==='stuck'?'#7a8794':'#c2372b');s.head.position.x=s.x+(s.type==='spike'?Math.sin(t*50)*.04:0);s.head.rotation.z=s.type==='drift'?.5:0;}}
  const w=el.clientWidth,h=el.clientHeight,v=new THREE.Vector3();
  for(const k in ch){v.copy(ch[k].g.position);v.y=2.5;v.project(camera);const b=bub[k];
    b.style.left=((v.x*.5+.5)*w)+'px';b.style.top=((-v.y*.5+.5)*h)+'px';b.style.visibility=v.z>1?'hidden':'visible';}
}
function resize(){const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
function loop(){raf=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);update(dt,clock.elapsedTime);controls.update();renderer.render(scene,camera);}
export function init(container){
  el=container;clock=new THREE.Clock();
  renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  el.prepend(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#cfe8f5');
  camera=new THREE.PerspectiveCamera(45,1,.1,200);camera.position.set(0,13,15);
  controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(0,0,.5);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=5;controls.maxDistance=34;controls.update();
  scene.add(new THREE.HemisphereLight('#ffffff','#8a9a7a',1.1));
  const dl=new THREE.DirectionalLight('#ffffff',1.2);dl.position.set(6,14,8);scene.add(dl);
  build();
  const s=KA.snapshot();s.zOn.forEach((on,i)=>{if(i>0)setZ(i,on);});rain=s.rain;
  for(const k in sens)if(s.bad[k]){sens[k].bad=true;sens[k].type='stuck';}
  KA.on('go',(k,p)=>{if(ch[k])ch[k].target=w3(p);});
  KA.on('say',(k,t,ms)=>{const b=bub[k];if(!b)return;b.textContent=t;b.style.opacity=1;clearTimeout(bt[k]);bt[k]=setTimeout(()=>{b.style.opacity=0;},ms||4200);});
  KA.on('zone',setZ);KA.on('rain',b=>{rain=!!b;});
  KA.on('anomaly',a=>{const s=sens[a.sensor||'tanah'];if(!s)return;s.bad=a.status==='detected';s.type=a.type;
    if(!s.bad){s.head.material.color.set('#9b8be0');s.head.position.x=s.x;s.head.rotation.z=0;}});
  new ResizeObserver(resize).observe(el);resize();
}
export function setVisible(v){if(v){resize();if(!raf){clock.getDelta();loop();}}else if(raf){cancelAnimationFrame(raf);raf=0;}}

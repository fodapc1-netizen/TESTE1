// Estudo visual original para Mundo 3D: cidade costeira, câmera imersiva.
(function(){
 let city,ocean,boat,clouds;const cars=[],waves=[],boats=[];
 const add=(geo,color,parent,x=0,y=0,z=0,opts={})=>{const m=K.malha(geo,K.mat(color,opts));m.position.set(x,y,z);parent.add(m);return m};
 const box=(w,h,d,c,p,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),c,p,x,y,z);
 function roof(w,d,h,color,p,x,y,z){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(0,h);s.lineTo(w/2,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});return add(g,color,p,x,y,z-d/2)}
 function house(p,x,z,i){const g=new THREE.Group();p.add(g);g.position.set(x,0,z);const color=[0xf3e8d7,0xd8e4ea,0xe6ceb5,0xc2d1be][i%4];box(5.8,.1,6.2,0xb9c6b4,g,0,.12,0);box(3.3,2.7,3.4,color,g,0,1.5,-.3);roof(3.9,4.1,1.0,[0xaa6148,0x39464e,0x89534e][i%3],g,0,2.85,-.3);box(.7,.6,.65,0x788083,g,-.8,3.3,-1.2);
 for(let j=-1;j<=1;j+=2){box(.9,1.1,.07,0x437d9b,g,j*.98,1.8,1.44);box(.99,.08,.12,0xfcf2d8,g,j*.98,1.22,1.5);box(.05,1.08,.1,0xd7ddd4,g,j*.98,1.8,1.5);box(.87,.05,.1,0xd7ddd4,g,j*.98,1.8,1.5)}
 box(.62,1.65,.1,0x576568,g,0,1.0,1.47);box(.32,.1,1.4,0x889b9d,g,0,.15,2.2);
 for(let j=0;j<4;j++){box(.56,.07,.42,0xe0ded3,g,(j%2)*.7-.35,.2,1.8+Math.floor(j/2)*.65)}
 for(let side of [-1,1]){box(.12,.65,5.3,0xeee3cd,g,side*2.5,.42,-.1);for(let k=0;k<8;k++)box(.1,.48,.08,0xf4ecd9,g,side*2.5,.72,-2.5+k*.7)}
 }
 function tree(p,x,z,size=1){const g=new THREE.Group();p.add(g);g.position.set(x,0,z);g.scale.setScalar(size);add(new THREE.CylinderGeometry(.13,.2,1.9,7),0x70553a,g,0,1,0);for(let j=0;j<4;j++)add(new THREE.IcosahedronGeometry(.8,0),[0x4b963e,0x6dab48,0x71b04d,0x3a833b][j],g,Math.sin(j*2)*.45,2.25+(j%2)*.4,Math.cos(j*2)*.45)}
 function streetlight(p,x,z){const g=new THREE.Group();p.add(g);g.position.set(x,0,z);add(new THREE.CylinderGeometry(.06,.09,4.7,8),0x687b86,g,0,2.35,0);box(1,.09,.1,0x687b86,g,.45,4.7,0);box(.65,.08,.28,0xd9e4e6,g,.7,4.66,0)}
 function truck(p,x,z){const g=new THREE.Group();p.add(g);g.position.set(x,.12,z);box(1.8,.8,.8,0xf0b337,g,0,.65,0);box(.7,.7,.8,0xf4cc4d,g,.7,1.1,0);box(.04,.38,.7,0x2d526a,g,1.07,1.25,0);for(const a of [-.65,.65])for(const b of [-.45,.45]){const w=add(new THREE.CylinderGeometry(.26,.26,.15,12),0x27343b,g,a,.3,b);w.rotation.x=Math.PI/2}return g}
 function ship(p,x,z,scale=1){const g=new THREE.Group();p.add(g);g.position.set(x,0,z);g.scale.setScalar(scale);const sh=new THREE.Shape();sh.moveTo(-3,-.5);sh.lineTo(-2.7,.5);sh.lineTo(2.2,.5);sh.lineTo(3,-.1);sh.lineTo(2.4,-.6);sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:1.5,bevelEnabled:true,bevelSize:.1,bevelThickness:.1,bevelSegments:1});add(geo,0x233e5b,g,0,.15,-.75);box(4.4,.12,1.4,0xc8c4af,g,-.3,.77,0);box(1.1,1.1,1.2,0xf4eee1,g,-1.6,1.35,0);box(.7,.35,.85,0x5c8094,g,-1.6,2.0,0);box(.25,.8,.3,0xd16637,g,-1.8,2.4,0);for(let i=0;i<4;i++)box(.65,.55,1.1,[0xd36544,0x3b8599,0xebc54a,0x597988][i],g,-.3+i*.65,1.1,0);boats.push(g);return g}
 function montar(tl){
 K.scene.background=new THREE.Color(0x77b6ed);city=new THREE.Group();K.scene.add(city);
 box(700,.3,900,0x68a15d,city,-350,-.25,0);
 box(8,.06,900,0x343f48,city,-9,.02,0);box(2,.14,900,0xd0d0c1,city,-3.9,.08,0);box(1.4,.14,900,0xc4c7bd,city,-14.0,.08,0);
 for(let k=-35;k<36;k++){box(.12,.02,2.5,0xf8e29b,city,-9,.07,k*5.8);streetlight(city,-4.5,k*11);if(k%2===0)tree(city,-2.9,k*9,1.15);}
 for(let block=0;block<5;block++){
 const road=-20-block*19;box(5,.08,900,0x47525a,city,road,.015,0);
 for(let j=-9;j<=9;j++){const z=j*10;house(city,road-6.5,z,block+j+12);house(city,road+6.2,z,block+j+17);tree(city,road-3.4,z+3,1.1);if(j%2===0)tree(city,road+7,z-3.8,.9)}
 }
 for(let k=-15;k<16;k++){box(690,.1,4.4,0x424c55,city,-350,.03,k*30+15);for(let j=0;j<7;j++)box(.22,.025,1.3,0xe7e8dd,city,-10+j*.38,.12,k*30+15)}
 for(let row=0;row<11;row++)for(let col=0;col<12;col++){
 const x=-23-col*8,z=-110-row*11;const h=2.6+((row+col)%4)*.45;
 box(4,h,4.7,[0xe2dacc,0xc7d1cf,0xe0c6aa][col%3],city,x,h/2,z);
 roof(4.6,5.2,.9,[0x9a5f47,0x4a555d][row%2],city,x,h,z);
 if(col%3===0)tree(city,x+3.0,z+1,1.1);
 }
 // Constructions variées dans l'arrière-plan.
 for(let i=0;i<8;i++){const g=K.predio(5+i%5,3.5,3.8,[0xd4d9d2,0xabbfd0,0xddc7aa][i%3],.8).g;K.scene.remove(g);g.position.set(-25-(i%4)*9,0,-49-Math.floor(i/4)*10);city.add(g)}
 box(1.0,1.6,900,0x9ea9a3,city,-1.3,-.65,0);box(.28,.34,900,0xe6d4ad,city,-1.3,.25,0);
 for(let j=-60;j<61;j++){box(.13,.62,.13,0x758b95,city,-1.3,.8,j*4);box(.08,.08,4,0x758b95,city,-1.3,1.08,j*4+2)}
 ocean=new THREE.Group();K.scene.add(ocean);const water=box(900,.12,1000,0x2589b9,ocean,449,-.28,0);water.material.roughness=.24;water.material.metalness=.18;
 for(let i=0;i<110;i++){const x=2+(i*13.17)%130,z=-95+(i*7.31)%190;const w=box(.5+(i%4)*.4,.014,.035,0x71c8da,ocean,x,-.20,z);waves.push(w)}

 for(let j=0;j<8;j++){const g=K.carro([0xc4443a,0xd7d9ce,0x33799b,0xefbf43][j%4]);g.scale.setScalar(.8);K.scene.remove(g);city.add(g);g.position.set(-7+(j%2)*-4,.12,-35+j*10);g.rotation.y=Math.PI/2;cars.push(g)}
 clouds=new THREE.Group();K.scene.add(clouds);for(let i=0;i<8;i++)for(let j=0;j<3;j++){const c=add(new THREE.SphereGeometry(3.0,12,8),0xeff7ff,clouds,-60+i*20+j*3,32+(i%3)*3,-65-j*3);c.scale.set(1.7,.35,1)}
 const brand=document.createElement('div');brand.style.cssText='position:absolute;left:52px;top:90px;color:white;font:800 27px Arial;letter-spacing:5px;text-shadow:0 2px 4px #183e59';brand.textContent='MUNDO 3D';K.palco.appendChild(brand);
 const title=document.createElement('div');title.id='ref-titulo';title.style.cssText='position:absolute;left:75px;right:75px;top:230px;text-align:center;color:#fff;font:900 68px Arial;line-height:1.03;text-shadow:0 4px 0 #17384f,0 0 8px #17384f';title.innerHTML='NAVIO DE AÇO FLUTUA…<br><span style="color:#ffe75e">E O PREGO AFUNDA?</span>';K.palco.appendChild(title);
 }
 function cena(tc,t){K.ceu('dia');K.scene.background.set(0x77b6ed);K.neblina(75,220);K.sol.intensity=3.0;K.hemi.intensity=1.6;const u=K.clamp(tc/4);const v=K.suave(u);
 // Travelling contínuo do bairro para o cais e para a obra.
 const pos=[-4-v*4,8.5-v*1.3,24-v*13],target=[-23+v*2,2.0,-6-v*4];K.mirar(pos,target);K.camera.fov=48;K.camera.updateProjectionMatrix();
 cars.forEach((g,i)=>g.position.z=-40+((i*12+t*2.6)%90));waves.forEach((w,i)=>w.position.y=-.20+Math.sin(t*1.2+i*.7)*.015);boats.forEach((g,i)=>{g.position.x=[14,48,34][i]+Math.sin(t*.18+i)*.4;g.position.y=Math.sin(t*1.4+i)*.04;g.rotation.z=Math.sin(t+i)*.009});
 }
 window.CENA={montar,cena,capa:()=>cena(0,0)};
})();

// Experiência e navio são modelos separados: massa conservada na experiência,
// empuxo hidrostático e carga transferida ao navio somente após apoio no convés.
(function(){
 const town=window.CENA;let tl,blocks,cityObjects=[],sea,lab,ship,waterMesh,hullFront,deck,cargo=[],labBoat,panels=[],block,nail,labLoad,avatar,up,down,measure,measuringWater,logo,head,subhead,crane,cable,hook,leak,shipY=.8,loadCount=0,labDraft=0,modelMass=0,modelDisplaced=0,fullLabWater,cutLabWater;
 const T=.03,L=4,W=2.5,H=1,RHO=1000,STEEL=7850,VSTEEL=L*W*T+2*L*H*T+2*(W-2*T)*H*T,MSTEEL=VSTEEL*STEEL,AREA=L*W,WATER=2.8;
 const xs=[-13,-11,-8,0,8,11,13],wf=[.60,.95,1,1,.95,.65,.025];
 const group=p=>{const o=new THREE.Group();p.add(o);return o};
 function mesh(geo,c,p,x=0,y=0,z=0,opt={}){const m=K.malha(geo,new THREE.MeshStandardMaterial({color:c,roughness:.7,side:THREE.DoubleSide,...opt}));m.position.set(x,y,z);p.add(m);return m}
 const box=(w,h,d,c,p,x,y,z,opt)=>mesh(new THREE.BoxGeometry(w,h,d),c,p,x,y,z,opt);
 const ball=(r,c,p,x,y,z,opt)=>mesh(new THREE.IcosahedronGeometry(r,1),c,p,x,y,z,opt);
 function rod(p,r,c){return mesh(new THREE.CylinderGeometry(r,r,1,12),c,p)}
 function setRod(m,a,b){const A=new THREE.Vector3(...a),d=new THREE.Vector3(...b).sub(A);m.position.copy(A).addScaledVector(d,.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())}
 function plaque(t,p,x,y,z,w=1.5,h=.5){const a=K.placa(t,{larg:w,alt:h,fundo:'#254453',cor:'#fff0b7',borda:'#79929b'});K.scene.remove(a);p.add(a);a.position.set(x,y,z);return a}
 function halfWidth(y){if(y<=-2.2)return 1.6;if(y<-.7)return 1.6+(y+2.2)/1.5*.4;return 2+(y+.7)/1.7;}
 function crossArea(y){if(y<=-2.2)return 0;const h1=Math.min(1.5,y+2.2);let a=(3.2+(3.2+.8*h1/1.5))*h1/2;if(y>-.7){const h2=Math.min(1.7,y+.7);a+=(4+(4+2*h2/1.7))*h2/2}return a}
 function widthFactor(x){for(let i=0;i<xs.length-1;i++)if(x>=xs[i]&&x<=xs[i+1])return K.lerp(wf[i],wf[i+1],(x-xs[i])/(xs[i+1]-xs[i]));return wf[0]}
 const weightedLength=xs.slice(1).reduce((s,x,i)=>s+(x-xs[i])*(wf[i]+wf[i+1])/2,0),BASE_MASS=crossArea(-.8)*weightedLength*1025;
 function solveY(mass){let lo=-1,hi=2.15;for(let i=0;i<32;i++){const y=(lo+hi)/2;const v=crossArea(-y)*weightedLength;if(v*1025>mass)lo=y;else hi=y}return (lo+hi)/2}
 function hull(p){const g=group(p),back=group(g),front=group(g);const levels=[[-3,1],[-2,-.7],[-1.6,-2.2],[1.6,-2.2],[2,-.7],[3,1]];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<levels.length-1;j++){const [za,ya]=levels[j],[zb,yb]=levels[j+1];const verts=[xs[i],ya,za*wf[i],xs[i+1],ya,za*wf[i+1],xs[i+1],yb,zb*wf[i+1],xs[i],yb,zb*wf[i]];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();mesh(geo,j>=3?0x356a87:j===2?0x90513e:0x447b92,j>=3?front:back)}
 // Tampas e anteparas fecham o casco; corte didático retira somente a face próxima.
 function transverse(parent,x,scale=1){const s=new THREE.Shape();levels.forEach(([z,y],i)=>i?s.lineTo(-z*scale,y):s.moveTo(-z*scale,y));s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:.08,bevelEnabled:false});geo.rotateY(Math.PI/2);return mesh(geo,0x8ba1a9,parent,x,0,0)}
 transverse(back,xs[0],wf[0]);transverse(back,xs[xs.length-1]-.08,wf[wf.length-1]);
 // Corte frontal revela cavernas e compartimentos secos.
 for(let x=-11;x<=9;x+=2){transverse(g,x,.91*widthFactor(x));box(1.8,.12,3.1*widthFactor(x),0xb4bfb6,g,x+.9,-1.65,0)}
 const deckG=group(g);const ds=new THREE.Shape();ds.moveTo(xs[0],-3*wf[0]);for(let i=1;i<xs.length;i++)ds.lineTo(xs[i],-3*wf[i]);for(let i=xs.length-1;i>=0;i--)ds.lineTo(xs[i],3*wf[i]);ds.closePath();const dg=new THREE.ShapeGeometry(ds);dg.rotateX(-Math.PI/2);mesh(dg,0xa8a493,deckG,0,1.08,0);for(let x=-12;x<11;x+=1)for(const side of [-1,1]){const z=side*(3*widthFactor(x)-.18),z2=side*(3*widthFactor(x+1)-.18);box(.06,.65,.06,0xd5d7c1,deckG,x,1.5,z);const bar=rod(deckG,.035,0xd5d7c1);setRod(bar,[x,1.82,z],[x+1,1.82,z2])}
 const bridge=group(g);bridge.position.set(-9.5,1.15,0);box(3.3,2.1,4.0,0xe4e6d8,bridge,0,1,0);box(3.0,.8,4.2,0xf1f1df,bridge,0,2.6,0);box(3.06,.35,4.25,0x3b697f,bridge,0,2.65,0);box(1.0,1.5,1.1,0xe1ae43,bridge,-.8,3.65,0);box(1.03,.35,1.14,0x304b5a,bridge,-.8,4.25,0);for(let i=0;i<6;i++)mesh(new THREE.CylinderGeometry(.1,.1,.06,12),0x3b6176,g,-11.5+i*.35,.9,2.1).rotation.x=Math.PI/2;
 hullFront=front;deck=deckG;return g;
 }
 function waterPlane(p,shipHole){const s=new THREE.Shape();s.moveTo(-400,-400);s.lineTo(400,-400);s.lineTo(400,400);s.lineTo(-400,400);s.closePath();if(shipHole){const hole=new THREE.Path();hole.moveTo(xs[0],-halfWidth(-.8)*wf[0]);for(let i=1;i<xs.length;i++)hole.lineTo(xs[i],-halfWidth(-.8)*wf[i]);for(let i=xs.length-1;i>=0;i--)hole.lineTo(xs[i],halfWidth(-.8)*wf[i]);hole.closePath();s.holes.push(hole)}const geo=new THREE.ShapeGeometry(s);geo.rotateX(-Math.PI/2);return mesh(geo,0x288ba6,p,0,0,0,{metalness:.14,roughness:.3})}
 function makeNail(p){const g=group(p);mesh(new THREE.CylinderGeometry(.055,.035,1.2,12),0xb9c9cc,g,0,0,0,{metalness:.7});mesh(new THREE.CylinderGeometry(.16,.16,.06,16),0xb9c9cc,g,0,.62,0,{metalness:.7});mesh(new THREE.ConeGeometry(.035,.20,12),0xb9c9cc,g,0,-.7,0).rotation.z=Math.PI;return g}
 function montar(timeline){
 tl=timeline;blocks=K.blocos(tl);const before=new Set(K.scene.children);town.montar(tl);cityObjects=K.scene.children.filter(o=>!before.has(o));sea=group(K.scene);lab=group(K.scene);ship=hull(K.scene);waterMesh=waterPlane(sea,true);
 for(let i=0;i<90;i++){const w=box(.6+(i%5)*.4,.018,.06,0x8ed0d5,sea,-50+(i*3.91)%120,.015,-70+(i*7.11)%140);w.userData.wave=i;}
 // Oito contêineres apoiados no convés, com nervuras e ferragens.
 for(let i=0;i<8;i++){const g=group(ship);g.position.set(-5.3+(i%4)*3.5,1.805,i<4?-1.05:1.05);const color=[0xcc7847,0x497e9b,0xb6a049,0x69968b][i%4];box(3.3,1.45,1.8,color,g,0,0,0);for(let j=0;j<12;j++)box(.05,1.32,1.84,color,g,-1.48+j*.27,0,0);for(let z of [-.91,.91])for(let x of [-1.5,1.5])box(.08,1.45,.05,0xc8ccb4,g,x,0,z);cargo.push(g)}
 crane=rod(ship,.20,0xe7bc48);cable=rod(ship,.025,0x2c4652);hook=group(ship);box(1.6,.15,1.0,0x4e707d,hook,0,0,0);for(let x of [-.7,.7])box(.08,.4,.1,0xe7bc48,hook,x,-.15,0);box(.7,4.0,.7,0xe7bc48,ship,-6.4,3.2,0);
 leak=box(16,.12,3.4,0x3b9fae,ship,-1.0,-.9,0,{transparent:true,opacity:.7});leak.visible=false;
 // Tanque industrial transparente: a experiência mantém a quantidade de aço.
 box(180,.25,160,0xb1beb9,lab,0,-.25,0);box(180,40,.8,0x9cbbc1,lab,0,18,-7.5);for(let x=-25;x<26;x+=5)box(.12,25,.15,0x829fa7,lab,x,12,-6.95);
 box(10.2,.3,7.2,0x718d96,lab,0,.15,0);for(let z of [-3.5,3.5])box(10,4,.05,0x90b9c1,lab,0,2.3,z,{transparent:true,opacity:.12,depthWrite:false});for(let x of [-5,5])box(.05,4,7,0x90b9c1,lab,x,2.3,0,{transparent:true,opacity:.12,depthWrite:false});
 for(let x of [-5,5])for(let z of [-3.5,3.5])box(.12,4.5,.12,0x6a8793,lab,x,2.4,z);
 const waterShape=new THREE.Shape();waterShape.moveTo(-5,-3.5);waterShape.lineTo(5,-3.5);waterShape.lineTo(5,3.5);waterShape.lineTo(-5,3.5);waterShape.closePath();const hole=new THREE.Path();hole.moveTo(-2,-1.25);hole.lineTo(-2,1.25);hole.lineTo(2,1.25);hole.lineTo(2,-1.25);hole.closePath();waterShape.holes.push(hole);const wg=new THREE.ShapeGeometry(waterShape);wg.rotateX(-Math.PI/2);const water=mesh(wg,0x4caabe,lab,0,WATER,0,{transparent:true,opacity:.65,depthWrite:false});water.name='lab-water';cutLabWater=water;fullLabWater=mesh(new THREE.PlaneGeometry(10,7).rotateX(-Math.PI/2),0x4caabe,lab,0,WATER,0,{transparent:true,opacity:.65,depthWrite:false});
 for(let z of [-3.5,3.5])box(10,2.5,.01,0x3697b5,lab,0,1.55,z,{transparent:true,opacity:.3,depthWrite:false});
 labBoat=group(lab);box(L,T,W,0xa8b9c1,labBoat,0,T/2,0,{metalness:.6});for(let side of [-1,1]){const h=group(labBoat);h.position.set(0,T,side*(W/2-T/2));box(L,H,T,0xa8b9c1,h,0,H/2,0,{metalness:.6});panels.push({g:h,type:'long',side});const e=group(labBoat);e.position.set(side*(L/2-T/2),T,0);box(T,H,W-2*T,0xa8b9c1,e,0,H/2,0,{metalness:.6});panels.push({g:e,type:'end',side})}
 const cube=Math.cbrt(VSTEEL);block=box(cube,cube,cube,0xa8b9c1,lab,0,4,0,{metalness:.6});nail=makeNail(lab);labLoad=group(labBoat);box(1.1,.7,.8,0xd8aa48,labLoad,0,.38,0);plaque('1 t',labLoad,0,.6,.42,.85,.35);
 measure=group(lab);measure.position.set(6.5,0,0);for(let z of [-.7,.7])box(2.0,4.5,.035,0xb0ccd2,measure,0,2.3,z,{transparent:true,opacity:.16,depthWrite:false});box(2.0,.12,1.4,0x6b8b98,measure,0,.35,0);measuringWater=box(1.8,1,1.2,0x319db4,measure,0,1,0,{transparent:true,opacity:.7});for(let i=0;i<8;i++)box(.4,.04,.06,0xe0e7cf,measure,.65,.7+i*.45,.75);plaque('ÁGUA DESLOCADA',measure,0,4.75,.75,2.5,.4);
 const outlet=rod(lab,.10,0x638c9a);setRod(outlet,[5,WATER,0],[6.5,WATER,0]);
 up=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(.8,1.3,1.8),1,0x5bdbc3,.3,.18);down=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(-.8,4.8,1.8),1,0xf4c952,.3,.18);lab.add(up,down);
 avatar=K.boneco({roupa:'camiseta',cores:{camiseta:0xf2c94c,bermuda:0x2a4a92,tenis:0xf4f1ea,cabelo:0x7a4a22}});lab.add(avatar.g);avatar.g.position.set(-4,.02,4.7);avatar.g.scale.setScalar(1.05);
 logo=K.logoFinal();head=document.createElement('div');head.style.cssText='position:absolute;top:220px;left:65px;right:65px;text-align:center;font:900 48px Arial;line-height:1.08;color:#ffe27d;text-shadow:0 3px 0 #214454,0 0 8px #214454';K.palco.appendChild(head);subhead=document.createElement('div');subhead.style.cssText='position:absolute;top:375px;left:65px;right:65px;text-align:center;font:700 28px Arial;color:#fff;text-shadow:0 2px 4px #214454';K.palco.appendChild(subhead);const css=document.createElement('style');css.textContent='.capa-titulo{display:none!important}.legenda{top:1395px!important;font-size:76px!important}';document.head.appendChild(css);
 }
 function scene(tc,t,override){
 const B=override?{plano:override,p:.2,t:1,inicio:0,dur:3}:K.blocoEm(blocks,tc),n=B.plano,p=B.p;
 const outdoor=['gancho','segue','cartao','capa'].includes(n),seaView=['carga','calado','limite','resumo'].includes(n),isLab=!outdoor&&!seaView;
 cityObjects.forEach(o=>o.visible=outdoor);sea.visible=seaView;lab.visible=isLab;ship.visible=outdoor||seaView;K.domo.visible=outdoor||seaView;K.ceu('dia');K.neblina(80,250);K.hemi.intensity=1.8;K.sol.intensity=2.8;
 if(isLab){K.scene.background.set(0x8eaeb8);K.hemi.groundColor.set(0x91a09b)}
 document.getElementById('ref-titulo').style.display=['gancho','capa'].includes(n)?'block':'none';head.style.display=outdoor?'none':'block';subhead.style.display=outdoor?'none':'block';
 const completed=n==='carga'?Math.floor(Math.min(.999999,p)*8):['gancho','capa','calado','limite','resumo','segue','cartao'].includes(n)?8:0,q=n==='carga'?(p*8-completed):1;
 loadCount=n==='carga'?completed+K.suave(K.faixa(q,.8,1)):completed;shipY=solveY(BASE_MASS+loadCount*3000);ship.position.set(outdoor?14:0,shipY+(outdoor?-.22:0),outdoor?-12:0);
 cargo.forEach((o,i)=>{o.visible=i<=completed;o.position.y=1.805+(n==='carga'&&i===completed?5*(1-K.suave(Math.min(1,q/.8))):0)});
 const active=cargo[Math.min(7,completed)];setRod(crane,[-6.4,5.0,0],[active.position.x,10,active.position.z]);setRod(cable,[active.position.x,10,active.position.z],[active.position.x,active.position.y+1.075,active.position.z]);hook.position.set(active.position.x,active.position.y+1.075,active.position.z);crane.visible=cable.visible=hook.visible=n==='carga';
 const cut=n==='resumo'||n==='limite';hullFront.visible=!cut;deck.visible=!cut;leak.visible=n==='limite';if(leak.visible){leak.scale.y=.2+p*7;leak.position.y=-1.4+p*.4;ship.position.y=shipY-p*.9;ship.rotation.x=p*.08}else ship.rotation.x=0;
 const a=waterMesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);if(Math.abs(x)<14&&Math.abs(z)<4){let f=wf[0];for(let k=0;k<xs.length-1;k++)if(x>=xs[k]-.001&&x<=xs[k+1]+.001){f=K.lerp(wf[k],wf[k+1],(x-xs[k])/(xs[k+1]-xs[k]));break}a.setZ(i,Math.sign(z)*halfWidth(-ship.position.y)*f)}}a.needsUpdate=true;
 const extra=n==='tonelada'?1000*K.suave(K.faixa(p,.65,1)):0;modelMass=MSTEEL+extra;modelDisplaced=modelMass/RHO;labDraft=modelDisplaced/AREA;
 labBoat.position.set(0,WATER-labDraft,0);labBoat.visible=!['prego','bloco'].includes(n);block.visible=n==='bloco';block.position.y=4.3-3.2*K.suave(p);nail.visible=n==='prego'||n==='compara';nail.position.set(n==='compara'?-3.2:0,4.3-3.0*K.suave(p),0);
 panels.forEach(({g,type,side})=>{g.rotation.set(0,0,0);const open=n==='casco'?1-K.suave(Math.min(1,p/.65)):0;if(type==='long')g.rotation.x=side*open*Math.PI/2;else g.rotation.z=-side*open*Math.PI/2});if(n==='casco')labBoat.position.y=K.lerp(4.0,WATER-labDraft,K.suave(K.faixa(p,.65,1)));
 cutLabWater.visible=labBoat.visible&&labBoat.position.y<=WATER;fullLabWater.visible=!cutLabWater.visible;labLoad.visible=n==='tonelada';labLoad.position.y=1.5*(1-K.suave(Math.min(1,p/.65))); // entrega gradual de peso no modelo didático
 up.visible=down.visible=['empuxo','nome_empuxo','equilibrio'].includes(n);const forceScale=n==='empuxo'?.4+.6*p:1;up.setLength(1.3*forceScale,.3,.16);down.setLength(1.3,.3,.16);
 measure.visible=['desloca','empuxo','nome_empuxo','equilibrio','tonelada'].includes(n);measuringWater.scale.y=Math.max(.01,modelDisplaced*.42);measuringWater.position.y=.42+measuringWater.scale.y/2;
 avatar.g.visible=isLab&&['casco','equilibrio','tonelada'].includes(n);avatar.reset(tc);avatar.capacete();avatar.g.rotation.y=-.55;avatar.apontar(.7);
 let from,to,target,target2,fov=48;
 if(outdoor){town.cena(p*4,t);from=[-4,12,22];to=[0,10,18];target=[12,1,-12];target2=[13,1,-12];fov=52;}
 else if(seaView){if(n==='calado'){from=[6,2,13];to=[4,1.7,11];target=[3,-.1,1.5];target2=[3,-.1,1.5];fov=50}else{from=[18,12,31];to=[14,10,28];target=[-1,1,0];target2=[0,1,0];fov=54}}
 else if(n==='prego'||n==='bloco'){from=[4,4.3,8];to=[3.2,3.3,7];target=[0,2.4,0];target2=[0,1.7,0];fov=49;}
 else if(n==='compara'){from=[5,6,12];to=[4,5.5,11];target=[-1,2.6,0];target2=[-1,2.4,0];}
 else{from=[8,7.5,13];to=[6.5,6.7,12];target=[1,2.6,0];target2=[1,2.6,0];fov=51;}
 K.mirar(K.lerp3(from,to,K.suave(p)),K.lerp3(target,target2,K.suave(p)));K.camera.fov=fov;K.camera.updateProjectionMatrix();
 const titles={prego:'O PREGO AFUNDA',bloco:'METAL COMPACTO',casco:'MESMA QUANTIDADE DE AÇO',desloca:'O CASCO AFASTA A ÁGUA',empuxo:'A ÁGUA EMPURRA PARA CIMA',nome_empuxo:'EMPUXO',equilibrio:'EMPUXO = PESO',compara:'POUCA ÁGUA PARA TANTO PESO',carga:'MAIS CARGA NO CONVÉS',calado:'O NAVIO MERGULHA UM POUCO MAIS',tonelada:'1 t DE CARGA → 1 t DE ÁGUA',limite:'EXISTE UM LIMITE',resumo:'O FORMATO DO CASCO FAZ DIFERENÇA'};head.textContent=titles[n]||'';subhead.textContent=n==='limite'?'SIMULAÇÃO DIDÁTICA DE ALAGAMENTO':isLab?'MODELO DIDÁTICO EM ÁGUA DOCE':cut?'VISÃO EM CORTE':'';
 if(n==='segue'||n==='cartao')logo.em(B.t);
 }
 window.CENA={montar,cena:scene,capa:()=>scene(0,0,'capa'),auditar:()=>{K.scene.updateMatrixWorld(true);let gap=Infinity;if(lab.visible&&avatar.g.visible){const bb=new THREE.Box3().setFromObject(avatar.g);gap=bb.min.z-3.55}return {avatarVisivel:lab.visible&&avatar.g.visible,folgaVidro:Number.isFinite(gap)?gap:null,massaAco:MSTEEL,volumeAco:VSTEEL,massaModelo:modelMass,aguaDeslocadaKg:modelDisplaced*RHO,caladoModelo:labDraft,caladoNavio:1.0-shipY,contatosValidos:cargo.every((o,i)=>!o.visible||o.position.y>=1.805-1e-6),residuoEmpuxoNavio:crossArea(-shipY)*weightedLength*1025-(BASE_MASS+loadCount*3000)}}};
})();

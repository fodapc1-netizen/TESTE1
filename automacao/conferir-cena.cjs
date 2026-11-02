const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function check(dir){
 const r=JSON.parse(fs.readFileSync(path.join(dir,'roteiro.json')));
 let t=.15;
 const frases=r.frases.map(f=>{const inicio=t,words=f.texto.split(/\s+/),fim=inicio+words.length/3;t=fim+.1;return {...f,marcado:f.texto,inicio,fim,palavras:words.map((texto,i)=>({texto,chave:false,inicio:inicio+i/3,fim:inicio+(i+1)/3}))}});
 frases.push({plano:'cartao',texto:'',marcado:'',inicio:t,fim:t+1.6,palavras:[]});
 const tl={frases,total:t+1.6,roteiro:r,capa:r.capa};
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||chromium.executablePath(),args:['--enable-gpu','--ignore-gpu-blocklist']});
 try{
  const p=await browser.newPage({viewport:{width:360,height:640}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',route=>route.abort());
  await p.setContent('<style>html,body{margin:0}body{transform:scale(.333333333);transform-origin:0 0}#palco{position:relative;width:1080px;height:1920px;overflow:hidden}</style><div id="palco"><div id="legenda" class="legenda"></div></div>');
  await p.evaluate(v=>window.LOGO=v,'data:image/png;base64,'+fs.readFileSync(path.join(root,'canal/logo.png')).toString('base64'));
  for(const f of [path.join(path.dirname(require.resolve('three')),'three.min.js'),path.join(root,'motor/kit.js'),path.join(dir,'cena.js')])await p.addScriptTag({path:f});
  await p.evaluate(tl=>{if(typeof CENA.montar!=='function'||typeof CENA.cena!=='function'||typeof CENA.capa!=='function')throw Error('API CENA incompleta');K.init();K.renderer.setPixelRatio(1/3);K.sol.shadow.mapSize.set(512,512);K.preparar(tl);CENA.montar(tl)},tl);
  const out=path.join(dir,'conferencia');fs.mkdirSync(out,{recursive:true});
  for(let i=0;i<frases.length;i++){
   const f=frases[i];
   for(const frac of [0,.5,.99])await p.evaluate(t=>K.quadro(t),f.inicio+(f.fim-f.inicio)*frac);
   await p.screenshot({path:path.join(out,`cena-${i}.png`)});
  }
  await p.evaluate(c=>K.capa(c),r.capa||r.titulo);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`Cena executou ${frases.length*3} instantes sem erros de JavaScript. Revisão visual humana continua necessária.`);
 }finally{await browser.close()}
}
if(require.main===module)check(path.resolve(process.argv[2])).catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={check};

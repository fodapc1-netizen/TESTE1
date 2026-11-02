const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
const save = (p, value) => fs.writeFileSync(path.join(root, p), JSON.stringify(value, null, 2) + '\n');
function select(queue, done) {
  const ids = new Set();
  for (const item of queue) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id) || typeof item.tema !== 'string') throw Error('Fila inválida');
    ids.add(item.id);
  }
  return queue.find(item => !Object.hasOwn(done, item.id));
}
function validate(pack) {
  if (!pack || typeof pack.cena !== 'string' || typeof pack.publicacao !== 'string') throw Error('Resposta incompleta da IA');
  const r = pack.roteiro;
  if (!r || typeof r.titulo !== 'string' || !Array.isArray(r.frases) || r.frases.length < 8 || r.frases.length > 20) throw Error('Roteiro inválido');
  if (r.frases.some(f => typeof f.texto !== 'string' || !/^[a-z0-9_]+$/.test(f.plano))) throw Error('Frase inválida');
  const text = r.frases.map(f => f.texto).join(' ');
  if (text.length > 4500 || text.split(/\s+/).length > 320) throw Error('Roteiro excede o limite diário');
  if (!/CENA/.test(pack.cena) || /\b(?:fetch|XMLHttpRequest|WebSocket|eval|importScripts)\s*\(|\bimport\s|https?:\/\//.test(pack.cena)) throw Error('A cena deve ser local, sem chamadas externas');
  r.fps = 24;
  r.estilo = 'facetado';
  r.voz = {motor:'elevenlabs',id:'iJ7HFMLySFb7M2U4KGy5',modelo:'eleven_multilingual_v2',estabilidade:.4,similaridade:.8,estilo:.3,velocidade:1.1,acelerar:1};
  r.trilha = {arquivo:'trilha',ganho:.1};
  r.cauda = {segundos:1.6,plano:'cartao'};
  return pack;
}
async function generate(item) {
  if (!process.env.OPENAI_API_KEY) throw Error('Cadastre OPENAI_API_KEY nos secrets do GitHub Actions.');
  const files = ['canal/identidade.md','referencias/kit-indice.md','motor/kit.js','automacao/exemplo-roteiro.json','automacao/exemplo-cena.js'];
  const prompt = `Crie um vídeo ORIGINAL em português brasileiro sobre: ${item.tema}.
Retorne JSON com roteiro (objeto compatível com o exemplo), cena (JavaScript de navegador) e publicacao (legenda para redes).
230 a 290 palavras, 12 a 16 frases. Gancho curioso, fatos consolidados sem números inventados, escopo explícito e analogias identificadas. Não prometa visualizações. Final: Curtiu descobrir? Segue o Mundo 3D! Qual coisa a gente desmonta no próximo?
CENA deve expor montar(timeline), cena(tc,t) e capa(), seguindo EXATAMENTE a API real K abaixo. Toda dependência já existe: THREE e K. Sem rede, imports ou bibliotecas externas. Funções e materiais locais. Não use o exemplo de navio como cenário para outro tema; crie cenário e mecanismo próprios do tema.
Cada frase tem plano distinto, cena acompanha K.estadoJogo(t).tc e progresso usando K.blocos(timeline) e K.blocoEm(blocos,tc); consulte implementação do kit. Movimentos determinísticos por t, sem depender de quadros anteriores. Câmara vertical dentro de mundo contínuo até horizonte, sem bordas ou bases de maquete. Variação entre planos abertos, mecanismo em corte e detalhes. Nunca posicione personagem dentro de objetos; reserve área segura ou oculte em cortes. Geometria apoiada, peças conectadas, sem atravessar paredes. Evite texto extra sobre legendas. CTA e logo no final. Não alegue simulação física real para animação didática.
Use apenas fatos seguros; evite afirmações universais que dependem do equipamento. Faça revisão factual e visual interna antes de retornar. A revisão humana do vídeo será obrigatória.
Referências técnicas:\n` + files.map(p => `\n### ${p}\n${read(p)}`).join('');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},
    body:JSON.stringify({model:process.env.OPENAI_MODEL || 'gpt-5',input:prompt,max_output_tokens:18000,text:{format:{type:'json_object'}}}),
    signal:AbortSignal.timeout(600000)
  });
  if (!response.ok) throw Error(`Serviço de IA: HTTP ${response.status}. Confira chave, saldo e modelo.`);
  const body = await response.json();
  if (body.status !== 'completed') throw Error('A IA não concluiu a geração; nenhum áudio será comprado.');
  const text = (body.output || []).flatMap(o => o.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('');
  return validate(JSON.parse(text));
}
async function main() {
  const mode = process.argv[2] || 'check';
  const item = select(json('automacao/fila.json'), json('automacao/concluidos.json'));
  if (mode === 'check') {
    console.log(item ? `Próximo tema: ${item.tema}` : 'Fila concluída. Nenhuma geração será feita.');
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `pendente=${Boolean(item)}\nid=${item?.id || ''}\n`);
    return;
  }
  if (!item) return;
  const rel = `videos/${item.id}`, dir = path.join(root,rel);
  fs.mkdirSync(dir,{recursive:true});
  if (mode === 'generate') {
    if (!process.env.ELEVENLABS_API_KEY) throw Error('Cadastre também ELEVENLABS_API_KEY no GitHub antes de gastar créditos de IA.');
    if (!fs.existsSync(path.join(dir,'roteiro.json')) || !fs.existsSync(path.join(dir,'cena.js'))) {
      const pack = await generate(item);
      save(`${rel}/roteiro.json`,pack.roteiro);
      fs.writeFileSync(path.join(dir,'cena.js'),pack.cena);
      fs.writeFileSync(path.join(dir,'publicacao.md'),pack.publicacao);
    }
    validate({roteiro:json(`${rel}/roteiro.json`),cena:read(`${rel}/cena.js`),publicacao:read(`${rel}/publicacao.md`)});
    execFileSync(process.execPath,['--check',path.join(dir,'cena.js')],{stdio:'inherit'});
  } else if (mode === 'render') {
    if (!process.env.ELEVENLABS_API_KEY) throw Error('ELEVENLABS_API_KEY ausente; interrompido sem voz de teste.');
    execFileSync(process.execPath,['--require',path.join(__dirname,'render-runtime.cjs'),'motor/render.js',rel],{cwd:root,stdio:'inherit',timeout:5400000});
    const ffmpeg = require('ffmpeg-static'), probe = require('ffprobe-static').path;
    const out = path.join(root,'entregas',item.id);
    fs.mkdirSync(out,{recursive:true});
    const video = path.join(out,`Mundo3D-${item.id}.mp4`);
    execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',path.join(dir,'video.mp4'),'-c:v','libx264','-profile:v','baseline','-level','3.1','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',video],{stdio:'inherit'});
    const meta = JSON.parse(execFileSync(probe,['-v','error','-show_streams','-show_format','-of','json',video]));
    const v = meta.streams.find(s => s.codec_type==='video'), a = meta.streams.find(s => s.codec_type==='audio');
    if (!a || !v || v.width!==720 || v.height!==1280 || +meta.format.duration<30 || +meta.format.duration>150) throw Error('Entrega reprovada na conferência técnica');
    execFileSync(ffmpeg,['-v','error','-xerror','-i',video,'-f','null','-'],{stdio:'inherit'});
    for (const f of ['capa.png','publicacao.md','roteiro.json','cena.js','timeline.json']) fs.copyFileSync(path.join(dir,f),path.join(out,f));
    fs.writeFileSync(path.join(out,'REVISAR-ANTES-DE-POSTAR.txt'),'Conferência técnica concluída. Confira fatos, narração, enquadramentos e colisões antes de postar. A geração por IA pode cometer erros. Nenhuma publicação em rede social foi realizada.\n');
  } else if (mode === 'complete') {
    if (!fs.existsSync(path.join(root,'entregas',item.id,`Mundo3D-${item.id}.mp4`))) throw Error('Não há vídeo pronto');
    const done=json('automacao/concluidos.json');
    done[item.id]={concluidoEm:new Date().toISOString(),execucao:process.env.GITHUB_RUN_ID || 'local',situacao:'aguardando-revisao'};
    save('automacao/concluidos.json',done);
  } else throw Error('Modo desconhecido');
}
module.exports={select,validate};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});

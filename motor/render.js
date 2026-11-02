// Preguiça 3D: transforma uma pasta de vídeo (roteiro.json + cena) num vídeo 9:16 com narração, legenda, som e capa.
//
//   node motor/render.js videos/<tema>                     vídeo completo (video.mp4 + capa.png)
//   node motor/render.js videos/<tema> --previa 1,5.5      só os quadros desses segundos (testes/previa-*.jpg), pra conferir rápido
//   node motor/render.js videos/<tema> --trecho 20,35      só esse pedaço, com som (testes/trecho-20s-35s.mp4)
//   node motor/render.js videos/<tema> --capa              só a capa 1080x1920 (capa.png)
//   --voz-teste                                            voz do computador (grátis), mesmo se o roteiro pedir ElevenLabs;
//                                                          o vídeo completo com ela é teste (testes/video-voz-teste.mp4)
//
// Na pasta do vídeo fica a entrega (video.mp4, capa.png, publicacao.md) e o roteiro; todo teste vai pra <pasta>/testes/.
//
// A cena: se a pasta tiver cena.js, usa ele. Senão, usa a cena-modelo do roteiro ("modelo": "montagem" → motor/cenas-modelo/montagem.js).
//
// roteiro.json:
//   voz: { motor: 'teste' }  ou  { motor: 'elevenlabs', id, modelo, velocidade, estabilidade, estilo, acelerar }
//     acelerar: 'auto' (chega no alvoPpm, até 1.35x) ou um número (1.2 = 20% mais rápido)
//   alvoPpm: palavras por minuto (os vídeos curtos que prendem ficam em 188 a 198)
//   frases: [{ texto, plano, ... }]   *palavra* no texto = termo-chave amarelo na legenda
//     gancho: true = a pergunta da capa (roteiro.capa) fica no topo durante a frase: a capa ganha vida no 1º segundo
//   capa: pergunta da capa (*palavra* amarela, \n quebra a linha)      cauda: { segundos, plano }
//   trilha: { arquivo (em motor/sons/), ganho }      efeitos: { ganho } (volume dos efeitos, padrão 0.855)
//     efeitos.abaixa: true   efeitos por baixo da voz (compressor + limitador + abaixam quando a voz fala); ganho padrão 1.2
//   estilo: 'redondo'   sombreamento liso, quinas arredondadas, cenário vivo, sombra macia, personagem mais realista
//   fps: 60             movimento mais fluido (padrão 30; o render leva o dobro do tempo)
//
// A chave da ElevenLabs fica no arquivo .env na raiz do projeto: ELEVENLABS_API_KEY=...
// Cada frase narrada é guardada em <pasta>/narracao/: renderizar de novo não gasta caracteres, só frase nova ou alterada.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const SONS = path.join(__dirname, 'sons');

// .env da raiz (sem precisar de flag no node)
const ENV = path.join(RAIZ, '.env');
if (fs.existsSync(ENV)) {
  for (const linha of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ffmpeg e ffprobe vêm junto pelo npm; se não, usa os do sistema
const opcional = (fn) => { try { return fn(); } catch (e) { return null; } };
const FFMPEG = opcional(() => require('ffmpeg-static')) || 'ffmpeg';
const FFPROBE = opcional(() => require('ffprobe-static').path) || 'ffprobe';

const pasta = path.resolve(process.argv[2] || '.');
if (!fs.existsSync(path.join(pasta, 'roteiro.json'))) {
  console.error(`Não achei ${path.join(pasta, 'roteiro.json')}. Uso: node motor/render.js videos/<tema>`);
  process.exit(1);
}
const arg = (nome) => { const i = process.argv.indexOf(nome); return i > 0 ? process.argv[i + 1] : null; };
const previa = arg('--previa') ? arg('--previa').split(',').map(Number) : null;
const trecho = arg('--trecho') ? arg('--trecho').split(',').map(Number) : null;
const vozTeste = process.argv.includes('--voz-teste');
const capa = process.argv.includes('--capa');
const roteiro = JSON.parse(fs.readFileSync(path.join(pasta, 'roteiro.json'), 'utf8'));
const FPS = roteiro.fps || 30;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'preguica3d-'));
// Os quadros temporários somem mesmo se o render der erro ou for interrompido (Ctrl+C): nada fica esquecido no computador
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
process.on('SIGINT', () => process.exit(130));
const emTestes = (nome) => { fs.mkdirSync(path.join(pasta, 'testes'), { recursive: true }); return path.join(pasta, 'testes', nome); };

const voz = roteiro.voz || { motor: 'teste' };
let motor = vozTeste ? 'teste' : voz.motor || 'teste';
if (motor === 'elevenlabs' && !process.env.ELEVENLABS_API_KEY) {
  console.warn('Sem ELEVENLABS_API_KEY no .env: usando a voz de teste do computador.');
  motor = 'teste';
}
const PAUSA = motor === 'teste' ? 0.18 : 0.1; // respiro entre frases, em segundos

const duracao = (arq) =>
  parseFloat(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).toString());
const ffmpeg = (args) => execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });

// "*caixa d'água*." → [{ texto: 'caixa', chave: true }, { texto: "d'água", chave: true }]
function tokens(marcado) {
  let dentro = false;
  return marcado.split(/\s+/).filter(Boolean).map((tok) => {
    const abre = tok.startsWith('*');
    if (abre) dentro = true;
    const chave = dentro;
    if (tok.slice(abre ? 1 : 0).includes('*')) dentro = false;
    return { texto: tok.replace(/\*/g, '').replace(/[.,!?;:]+$/, ''), chave };
  });
}
const limpo = (marcado) => marcado.replace(/\*/g, '');

// ---------- Narração ----------

// Voz de teste: a do próprio computador (Mac: say; Windows: voz do sistema; Linux: espeak-ng)
function falarTeste(texto, wav) {
  const bruto = path.join(tmp, 'bruto' + (process.platform === 'darwin' ? '.aiff' : '.wav'));
  if (process.platform === 'darwin') {
    execFileSync('say', ['-v', voz.nomeTeste || 'Luciana', '-r', '190', '-o', bruto, texto]);
  } else if (process.platform === 'win32') {
    // O texto vai por arquivo em UTF-8: pela entrada do console, o PowerShell 5.1 lê na página de código antiga e
    // estraga os acentos (ç, ã, é)
    const fala = path.join(tmp, 'fala.txt');
    fs.writeFileSync(fala, texto, 'utf8');
    const ps = "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; " +
      "$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'pt*' } | Select-Object -First 1; " +
      "if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }; $s.Rate = 2; " +
      `$s.SetOutputToWaveFile('${bruto.replace(/'/g, "''")}'); ` +
      `$s.Speak([IO.File]::ReadAllText('${fala.replace(/'/g, "''")}', [Text.Encoding]::UTF8)); $s.Dispose()`;
    execFileSync('powershell', ['-NoProfile', '-Command', ps]);
  } else {
    execFileSync('espeak-ng', ['-v', 'pt-br', '-s', '175', '-w', bruto, texto]);
  }
  ffmpeg(['-i', bruto, '-ar', '48000', '-ac', '1', wav]);
}

function narrarTeste() {
  return roteiro.frases.map((f, i) => {
    const wav = path.join(tmp, `frase-${i}.wav`);
    falarTeste(limpo(f.texto), wav);
    const dur = duracao(wav);
    // Sem tempo por letra: distribui pelas sílabas (aproximação)
    const tk = tokens(f.texto);
    const peso = tk.map((w) => (w.texto.match(/[aeiouáéíóúâêôãõà]+/gi) || ['']).length + 0.35);
    const total = peso.reduce((a, b) => a + b, 0);
    let t = 0;
    const palavras = tk.map((w, j) => { const d = (peso[j] / total) * dur * 0.94; const p = { ...w, inicio: t, fim: t + d }; t += d; return p; });
    return { wav, dur, palavras };
  });
}

async function elevenlabs(texto, anterior, proximo) {
  const cfg = { id: voz.id, modelo: voz.modelo || 'eleven_multilingual_v2', estabilidade: voz.estabilidade ?? 0.45, similaridade: voz.similaridade ?? 0.8, estilo: voz.estilo ?? 0.25, velocidade: voz.velocidade ?? 1.1 };
  const hash = crypto.createHash('sha1').update(JSON.stringify([cfg, texto])).digest('hex').slice(0, 16);
  const dir = path.join(pasta, 'narracao');
  fs.mkdirSync(dir, { recursive: true });
  const mp3 = path.join(dir, hash + '.mp3'), json = path.join(dir, hash + '.json');
  if (fs.existsSync(mp3) && fs.existsSync(json)) return { mp3, al: JSON.parse(fs.readFileSync(json, 'utf8')), novo: false };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.id}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: texto, model_id: cfg.modelo, previous_text: anterior || undefined, next_text: proximo || undefined,
      voice_settings: { stability: cfg.estabilidade, similarity_boost: cfg.similaridade, style: cfg.estilo, speed: cfg.velocidade, use_speaker_boost: true }
    })
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const r = await res.json();
  fs.writeFileSync(mp3, Buffer.from(r.audio_base64, 'base64'));
  fs.writeFileSync(json, JSON.stringify(r.alignment));
  return { mp3, al: r.alignment, novo: true };
}

async function narrarElevenlabs() {
  const fs_ = roteiro.frases.map((f) => limpo(f.texto));
  const brutos = [];
  let gastos = 0;
  for (let i = 0; i < fs_.length; i++) {
    const r = await elevenlabs(fs_[i], fs_[i - 1], fs_[i + 1]);
    if (r.novo) { gastos += fs_[i].length; process.stdout.write(`  voz ${i + 1}/${fs_.length}\r`); }
    brutos.push(r);
  }
  if (gastos) console.log(`ElevenLabs: ${gastos} caracteres gastos`);

  // Palavras a partir do tempo de cada letra; corta o silêncio das pontas
  const fatias = brutos.map(({ mp3, al }, i) => {
    const ch = al.characters, ini = al.character_start_times_seconds, fim = al.character_end_times_seconds;
    const pal = [];
    let atual = null;
    ch.forEach((c, k) => {
      if (/\s/.test(c)) { atual = null; return; }
      if (!atual) { atual = { inicio: ini[k], fim: fim[k] }; pal.push(atual); }
      atual.fim = fim[k];
    });
    const s0 = Math.max(0, pal[0].inicio - 0.03), e0 = Math.min(duracao(mp3), pal[pal.length - 1].fim + 0.1);
    const tk = tokens(roteiro.frases[i].texto);
    if (tk.length !== pal.length) console.warn(`aviso: frase ${i + 1} tem ${tk.length} palavras no texto e ${pal.length} no áudio`);
    return { mp3, s0, e0, pal: pal.map((p, j) => ({ ...(tk[j] || { texto: '', chave: false }), inicio: p.inicio - s0, fim: p.fim - s0 })) };
  });

  // Aceleração: vídeo curto que prende roda a ~190 palavras/min
  const palavras = fatias.reduce((n, f) => n + f.pal.length, 0);
  const natural = fatias.reduce((s, f) => s + (f.e0 - f.s0) + PAUSA, 0);
  const ppm = palavras / (natural / 60);
  const fator = voz.acelerar && voz.acelerar !== 'auto' ? voz.acelerar : Math.min(1.35, Math.max(1, (roteiro.alvoPpm || 190) / ppm));
  console.log(`voz: ${ppm.toFixed(0)} palavras/min natural → acelerada ${fator.toFixed(2)}x → ${(ppm * fator).toFixed(0)} palavras/min`);

  return fatias.map((f, i) => {
    const wav = path.join(tmp, `frase-${i}.wav`);
    ffmpeg(['-i', f.mp3, '-af', `atrim=${f.s0.toFixed(3)}:${f.e0.toFixed(3)},asetpts=PTS-STARTPTS,atempo=${fator.toFixed(4)}`, '-ar', '48000', '-ac', '1', wav]);
    return { wav, dur: duracao(wav), palavras: f.pal.map((p) => ({ ...p, inicio: p.inicio / fator, fim: p.fim / fator })) };
  });
}

function montarTimeline(audios) {
  let t = 0.15;
  const frases = roteiro.frases.map((f, i) => {
    const { dur, palavras } = audios[i];
    const { texto, ...resto } = f;
    const fr = { ...resto, texto: limpo(texto), marcado: texto, inicio: t, fim: t + dur, palavras: palavras.map((p) => ({ ...p, inicio: t + p.inicio, fim: t + p.fim })) };
    t += dur + PAUSA;
    return fr;
  });
  if (roteiro.cauda) {
    frases.push({ texto: '', marcado: '', plano: roteiro.cauda.plano, inicio: t, fim: t + roteiro.cauda.segundos, palavras: [] });
    t += roteiro.cauda.segundos;
  }
  return { frases, total: t, cta: roteiro.cta || '', capa: roteiro.capa || '', estilo: roteiro.estilo || '' };
}

// ---------- Som ----------

// motor/sons/<nome>.wav|ogg; variações <nome>-1, <nome>-2... são sorteadas pelo instante (sempre igual)
const biblioteca = fs.existsSync(SONS) ? fs.readdirSync(SONS).filter((f) => /\.(wav|ogg|mp3)$/.test(f)) : [];
function arquivoSom(nome, em) {
  const op = biblioteca.filter((f) => f.replace(/\.\w+$/, '').replace(/-\d+$/, '') === nome).sort();
  if (!op.length) return null;
  return path.join(SONS, op[Math.floor(em * 7.31) % op.length]);
}

function mixar(audios, tl, sons, saidaVoz, saidaFinal, janela) {
  // Voz
  const a = [];
  audios.forEach((x) => a.push('-i', x.wav));
  const fv = audios.map((_, i) => `[${i}]adelay=delays=${Math.round(tl.frases[i].inicio * 1000)}:all=1[a${i}]`);
  fv.push(`${audios.map((_, i) => `[a${i}]`).join('')}amix=inputs=${audios.length}:normalize=0,apad=whole_dur=${tl.total.toFixed(3)}[out]`);
  fs.writeFileSync(path.join(tmp, 'voz.txt'), fv.join(';'));
  ffmpeg([...a, '-filter_complex_script', path.join(tmp, 'voz.txt'), '-map', '[out]', '-ar', '48000', '-ac', '1', saidaVoz]);

  // Efeitos
  const usados = sons.map((s) => ({ ...s, arq: arquivoSom(s.nome, s.em) })).filter((s) => s.arq && s.em < tl.total);
  const faltando = [...new Set(sons.filter((s) => !arquivoSom(s.nome, s.em)).map((s) => s.nome))];
  if (faltando.length) console.warn('sons sem arquivo em motor/sons/:', faltando.join(', '));
  const efeitos = path.join(tmp, 'efeitos.wav');
  if (usados.length) {
    const e = [];
    usados.forEach((s) => e.push('-i', s.arq));
    const fe = usados.map((s, i) => {
      const corte = s.dur ? `atrim=0:${s.dur},afade=t=out:st=${Math.max(0, s.dur - 0.25)}:d=0.25,` : '';
      return `[${i}]aformat=sample_rates=48000:channel_layouts=stereo,${corte}volume=${s.ganho},adelay=delays=${Math.round(s.em * 1000)}:all=1[e${i}]`;
    });
    fe.push(`${usados.map((_, i) => `[e${i}]`).join('')}amix=inputs=${usados.length}:normalize=0,apad=whole_dur=${tl.total.toFixed(3)}[out]`);
    fs.writeFileSync(path.join(tmp, 'efeitos.txt'), fe.join(';'));
    ffmpeg([...e, '-filter_complex_script', path.join(tmp, 'efeitos.txt'), '-map', '[out]', '-ar', '48000', '-ac', '2', '-t', tl.total.toFixed(3), efeitos]);
  } else ffmpeg(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', tl.total.toFixed(3), efeitos]);

  // Voz + efeitos + trilha (abaixa um pouco quando a voz fala), normalizado em −14 LUFS
  const ent = ['-i', saidaVoz, '-i', efeitos];
  const cfgEf = roteiro.efeitos || {};
  const ganhoEf = cfgEf.ganho ?? (cfgEf.abaixa ? 1.2 : 0.855);
  // abaixa: os efeitos ficam por baixo da voz. Compressor e limitador no barramento (som longo e forte e vários
  // sons juntos não estouram) e abaixam quando a voz fala, como a trilha
  let f = cfgEf.abaixa
    ? `[0]aformat=channel_layouts=stereo,asplit=3[voz][sc][scEf];[1]volume=${ganhoEf},` +
      'acompressor=threshold=0.06:ratio=4:attack=5:release=150,alimiter=limit=0.18:attack=3:release=80:level=false[efc];' +
      '[efc][scEf]sidechaincompress=threshold=0.012:ratio=3:attack=8:release=350[ef];'
    : `[0]aformat=channel_layouts=stereo,asplit[voz][sc];[1]volume=${ganhoEf}[ef];`;
  const trilha = roteiro.trilha && arquivoSom(roteiro.trilha.arquivo, 0);
  if (trilha) {
    ent.push('-stream_loop', '-1', '-i', trilha);
    f += `[2]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${tl.total.toFixed(3)},volume=${roteiro.trilha.ganho ?? 0.25},` +
      `afade=t=in:d=0.6,afade=t=out:st=${(tl.total - 1.5).toFixed(3)}:d=1.5[tr];` +
      '[tr][sc]sidechaincompress=threshold=0.04:ratio=3:attack=30:release=400[trd];[voz][ef][trd]amix=inputs=3:normalize=0';
  } else f += '[sc]anullsink;[voz][ef]amix=inputs=2:normalize=0';
  if (janela) f += `,atrim=${janela[0]}:${janela[1]},asetpts=PTS-STARTPTS`;
  // Folga de 3 dB: o AAC sobe o pico ~1,5 dB nos transientes (cliques, chimbal)
  f += ',loudnorm=I=-14:TP=-3:LRA=11,aresample=48000,alimiter=limit=0.66:level=false:attack=1[out]';
  ffmpeg([...ent, '-filter_complex', f, '-map', '[out]', '-ar', '48000', '-ac', '2', saidaFinal]);
}

const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=block">
<style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
#palco{position:relative;width:1080px;height:1920px;overflow:hidden}</style>
</head><body><div id="palco"><div class="legenda" id="legenda"></div></div></body></html>`;

// Logo do canal (canal/logo.png) pro final; sem logo, o final sai só com a plaquinha
function logoDataUrl() {
  const arq = ['logo.png', 'logo.jpg'].map((n) => path.join(RAIZ, 'canal', n)).find((a) => fs.existsSync(a));
  if (!arq) return '';
  return `data:image/${arq.endsWith('.png') ? 'png' : 'jpeg'};base64,` + fs.readFileSync(arq).toString('base64');
}

function arquivoCena() {
  const propria = path.join(pasta, 'cena.js');
  if (fs.existsSync(propria)) return propria;
  const modelo = path.join(__dirname, 'cenas-modelo', (roteiro.modelo || 'montagem') + '.js');
  if (!fs.existsSync(modelo)) throw new Error(`Cena-modelo "${roteiro.modelo}" não existe em motor/cenas-modelo/`);
  return modelo;
}

// GPU de cada sistema (no Mac, Metal; no resto, o padrão do Chromium)
const argsGpu = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--enable-gpu', '--ignore-gpu-blocklist'];

(async () => {
  console.log(`narração (${motor === 'teste' ? 'voz de teste' : 'ElevenLabs'})...`);
  const audios = motor === 'elevenlabs' ? await narrarElevenlabs() : narrarTeste();
  const tl = montarTimeline(audios);
  tl.roteiro = roteiro;
  fs.writeFileSync(path.join(pasta, 'timeline.json'), JSON.stringify(tl, null, 2));
  const nPal = tl.frases.reduce((n, f) => n + f.palavras.length, 0);
  console.log(`duração: ${tl.total.toFixed(1)}s, ${nPal} palavras, ${(nPal / (tl.total / 60)).toFixed(0)} palavras/min`);
  if (tl.total > 180) console.warn('ATENÇÃO: passou de 3:00, o limite do YouTube Shorts. Encurte o roteiro.');

  const browser = await chromium.launch({ channel: 'chromium', args: argsGpu });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('erro na cena:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('página:', m.text()); });
  await page.setContent(PAGINA, { waitUntil: 'networkidle' });
  await page.evaluate((logo) => { window.LOGO = logo; }, logoDataUrl());
  await page.addScriptTag({ path: path.join(RAIZ, 'node_modules', 'three', 'build', 'three.min.js') });
  await page.addScriptTag({ path: path.join(__dirname, 'kit.js') });
  await page.addScriptTag({ path: arquivoCena() });
  await page.evaluate(() => Promise.all([document.fonts.load('900 80px Montserrat'), document.fonts.load('800 80px Montserrat')]));
  await page.evaluate((tl) => {
    K.init();
    K.preparar(tl);
    CENA.montar(tl);
  }, tl);

  const quadro = async (t, arq) => {
    await page.evaluate((t) => K.quadro(t), t);
    await page.screenshot({ path: arq, type: 'jpeg', quality: 92 });
  };

  if (capa) {
    await page.evaluate((titulo) => K.capa(titulo), roteiro.capa || roteiro.titulo);
    await page.screenshot({ path: path.join(pasta, 'capa.png'), type: 'png' });
    console.log('capa salva:', path.join(pasta, 'capa.png'));
  } else if (previa) {
    for (const t of previa) await quadro(t, emTestes(`previa-${t.toFixed(1)}s.jpg`));
    console.log('prévias salvas em', path.join(pasta, 'testes'));
  } else {
    const [a, b] = trecho || [0, tl.total];
    const f0 = Math.floor(a * FPS), f1 = Math.ceil(Math.min(b, tl.total) * FPS);
    const inicio = Date.now();
    for (let f = f0; f < f1; f++) {
      await quadro(f / FPS, path.join(tmp, `q${String(f - f0).padStart(5, '0')}.jpg`));
      if ((f - f0) % 150 === 0) console.log(`quadro ${f - f0}/${f1 - f0}`);
    }
    console.log(`quadros em ${((Date.now() - inicio) / 1000).toFixed(0)}s`);
    // Sons de toda a timeline: passa uma vez por cada plano pra registrar os eventos de cena fora do trecho
    if (trecho) for (let t = 0; t < tl.total; t += 0.25) await page.evaluate((t) => K.quadro(t), t);
    const sons = await page.evaluate(() => K.sons);
    // Capa nos primeiros quadros (0,1 s): o YouTube Shorts só deixa escolher a capa entre os quadros do vídeo
    const temCapa = !trecho && roteiro.capa && (await page.evaluate(() => !!(window.CENA && CENA.capa)));
    if (temCapa) {
      await page.evaluate((titulo) => K.capa(titulo), roteiro.capa);
      await page.screenshot({ path: path.join(pasta, 'capa.png'), type: 'png' });
      for (let f = 0; f < Math.round(FPS / 10); f++) await page.screenshot({ path: path.join(tmp, `q${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
      console.log('capa salva e colocada nos primeiros quadros');
    }
    tl.sons = sons;
    fs.writeFileSync(path.join(pasta, 'timeline.json'), JSON.stringify(tl, null, 2));
    console.log(`${sons.length} efeitos sonoros`);

    const final = path.join(tmp, 'final.wav');
    mixar(audios, tl, sons, path.join(tmp, 'narracao.wav'), final, trecho ? [a, Math.min(b, tl.total)] : null);
    const saida = trecho ? emTestes(`trecho-${a}s-${b}s.mp4`) : vozTeste ? emTestes('video-voz-teste.mp4') : path.join(pasta, 'video.mp4');
    ffmpeg(['-framerate', String(FPS), '-i', path.join(tmp, 'q%05d.jpg'), '-i', final,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
      '-shortest', saida]);
    console.log('pronto:', saida);
    if (!trecho && !vozTeste && !fs.existsSync(path.join(pasta, 'publicacao.md'))) console.log('Falta o texto de postar: rode /publicar');
  }
  await browser.close();
})();

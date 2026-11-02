// Confere, item por item, se a Máquina está instalada e o canal configurado, antes de qualquer pedido de vídeo.
// A IA roda isto no começo da conversa e conta o resultado pra pessoa em palavras simples (comandos/boas-vindas.md).
// Uso: npm run conferir   (sai com código 0 se não faltar nada, 1 se faltar algo)
// Cada linha: [ok] pronto · [falta] resolver antes do vídeo · [aviso] funciona, com um porém · [opcional] não precisa
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const itens = [];
const item = (status, texto) => itens.push({ status, texto });
const roda = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }); } catch { return null; }
};
const modulo = (nome) => { try { return require(path.join(RAIZ, 'node_modules', nome)); } catch { return null; } };

const [maior] = process.versions.node.split('.').map(Number);
if (maior < 18) item('falta', `Node.js ${process.versions.node} é antigo: instale o Node 18 ou mais novo (versão LTS, em nodejs.org)`);
else item('ok', `Node.js ${process.versions.node}`);

// Motor de animação: as bibliotecas do npm e o ffmpeg/ffprobe que vêm junto (baixados no npm install)
const playwright = modulo('playwright');
const ffmpeg = modulo('ffmpeg-static');
const ffprobe = modulo('ffprobe-static');
const motorOk = playwright && fs.existsSync(path.join(RAIZ, 'node_modules/three')) &&
  ffmpeg && fs.existsSync(ffmpeg) && ffprobe && fs.existsSync(ffprobe.path);
if (motorOk) item('ok', 'motor de animação (bibliotecas e ffmpeg)');
else item('falta', 'motor de animação: rode npm install');

let navegador = false;
try { navegador = !!playwright && fs.existsSync(playwright.chromium.executablePath()); } catch { /* sem navegador */ }
if (navegador) item('ok', 'navegador que desenha o vídeo');
else item('falta', `navegador que desenha o vídeo: rode npx playwright install chromium${playwright ? '' : ' (depois do npm install)'}`);

// Voz de teste: a do próprio computador. É a das prévias e a do vídeo quando não tem a voz profissional
if (process.platform === 'darwin') {
  const vozes = roda('say', ['-v', '?']);
  if (vozes === null) item('aviso', 'voz de teste do computador: não consegui conferir');
  else if (/^Luciana\s/m.test(vozes)) item('ok', 'voz de teste do computador');
  else item('falta', 'voz de teste do computador: falta a voz Luciana (Ajustes do Sistema > Acessibilidade > Conteúdo Falado > Voz do Sistema > Gerenciar Vozes > Português (Brasil) > Luciana)');
} else if (process.platform === 'win32') {
  const culturas = roda('powershell', ['-NoProfile', '-Command',
    'Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Culture.Name }']);
  if (culturas === null) item('aviso', 'voz de teste do computador: não consegui conferir (o PowerShell não respondeu)');
  else if (/^pt/m.test(culturas)) item('ok', 'voz de teste do computador');
  else item('aviso', 'voz de teste do computador: o Windows não tem voz em português, então ela sai com sotaque de outra língua (serve pra testar; a voz profissional resolve)');
} else if (roda('espeak-ng', ['--version']) !== null) {
  item('ok', 'voz de teste do computador');
} else {
  item('falta', 'voz de teste do computador: rode sudo apt install espeak-ng');
}

// Canal: os modelos vêm com campos de exemplo entre colchetes ("[ex: ...]"); preenchidos, eles somem
const MODELO = /\[[^\]]*\b(ex|Ex|ej|Ej|Descreva)[:.][^\]]*\]/;
let canalOk = true;
for (const arq of ['canal/canal.md', 'canal/identidade.md']) {
  let txt = '';
  try { txt = fs.readFileSync(path.join(RAIZ, arq), 'utf8'); } catch { item('falta', `${arq} não existe`); canalOk = false; continue; }
  // nome do campo: o "**Campo:**" da linha ou, num parágrafo de exemplo, o título "## Seção" de cima
  const campos = [];
  let secao = '';
  for (const l of txt.split('\n')) {
    if (l.startsWith('## ')) secao = l.slice(3).trim();
    if (!MODELO.test(l)) continue;
    const rotulo = l.match(/^\*\*([^*:]+):?\*\*/);
    const nome = rotulo ? rotulo[1].trim() : secao;
    if (nome && !campos.includes(nome)) campos.push(nome);
  }
  if (campos.length) {
    item('falta', `${arq} ainda não foi configurado (${campos.slice(0, 4).join(', ')}${campos.length > 4 ? '...' : ''})`);
    canalOk = false;
  }
}
if (canalOk) item('ok', 'canal configurado (canal/canal.md e canal/identidade.md)');

// Voz profissional: só olha se a chave foi preenchida, sem mostrar nada do .env
let chave = false;
try { chave = /^\s*ELEVENLABS_API_KEY\s*=\s*["']?[^\s"']/m.test(fs.readFileSync(path.join(RAIZ, '.env'), 'utf8')); } catch { /* sem .env */ }
if (chave) item('ok', 'voz profissional (ElevenLabs): chave salva no .env');
else item('opcional', 'voz profissional (ElevenLabs): não configurada; sem ela, o vídeo sai com a voz do computador');

if (['logo.png', 'logo.jpg'].some((n) => fs.existsSync(path.join(RAIZ, 'canal', n)))) item('ok', 'logo do canal');
else item('opcional', 'logo do canal: sem logo (canal/logo.png); o fim do vídeo sai só com a plaquinha');

const falta = itens.some((i) => i.status === 'falta');
console.log(falta ? 'FALTA CONFIGURAR:' : 'PRONTO: Máquina instalada e canal configurado.');
itens.forEach((i) => console.log(`[${i.status}] ${i.texto}`));
if (falta) {
  console.log('Siga comandos/instalar.md antes de fazer qualquer vídeo.');
  process.exit(1);
}

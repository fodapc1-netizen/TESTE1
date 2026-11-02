// Amostras de voz da ElevenLabs pra escolher a voz do canal: cada uma vira canal/testes-de-voz/<nome-da-voz>.mp3.
// Uso: npm run testar-voz -- <id> [<id> ...]                 (com a frase de teste padrão)
//      npm run testar-voz -- <id> --texto "Outra frase"      (com uma frase sua)
// Cada amostra gasta os caracteres da frase (uns 110 na padrão) do plano da ElevenLabs.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PASTA = path.join(RAIZ, 'canal', 'testes-de-voz');
const sair = (msg) => { console.error('\n' + msg + '\n'); process.exit(1); };

// .env da raiz, como no render
const ENV = path.join(RAIZ, '.env');
if (fs.existsSync(ENV)) {
  for (const linha of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const CHAVE = process.env.ELEVENLABS_API_KEY;

const args = process.argv.slice(2);
const iTexto = args.indexOf('--texto');
const texto = iTexto >= 0 ? args[iTexto + 1] : 'Como uma pilha desse tamanho ilumina o quintal inteiro? Essa é a voz que vai narrar os vídeos do seu canal.';
const ids = args.filter((a, i) => a !== '--texto' && (iTexto < 0 || i !== iTexto + 1));
if (!ids.length) sair('Diga o id de pelo menos uma voz. Ex: npm run testar-voz -- TX3LPaxmHKxFdv7VOQHJ');
if (!texto) sair('Faltou a frase depois de --texto. Ex: npm run testar-voz -- <id> --texto "Oi, tudo bem?"');
if (!CHAVE) sair('Falta a chave da ElevenLabs no arquivo .env (ELEVENLABS_API_KEY=...).');

const nomeArquivo = (nome) => nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(async () => {
  fs.mkdirSync(PASTA, { recursive: true });
  let feitas = 0;
  for (const id of ids) {
    const info = await fetch(`https://api.elevenlabs.io/v1/voices/${id}`, { headers: { 'xi-api-key': CHAVE } });
    const nome = info.ok ? (await info.json()).name : id;
    // Os mesmos ajustes do render, pra amostra soar como o vídeo vai soar
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: texto, model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, speed: 1.1, use_speaker_boost: true }
      })
    });
    if (!res.ok) { console.error(`${nome}: a ElevenLabs recusou (${res.status}): ${await res.text()}`); continue; }
    const arq = path.join(PASTA, `${nomeArquivo(nome) || id}.mp3`);
    fs.writeFileSync(arq, Buffer.from(await res.arrayBuffer()));
    console.log(`${nome}: ${path.relative(RAIZ, arq)}`);
    feitas++;
  }
  console.log(`${feitas} de ${ids.length} amostras em ${path.relative(RAIZ, PASTA)} (${texto.length} caracteres cada)`);
  if (!feitas) process.exit(1);
})();

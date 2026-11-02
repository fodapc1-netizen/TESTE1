// Cena-modelo "montagem" (Preguiça 3D): o objeto do vídeo é montado peça por peça, sem escrever código de cena.
// Tudo vem do roteiro.json (exemplo completo em videos/exemplo/roteiro.json):
//
//   lugar: 'quintal' | 'praia' | 'cozinha' | 'espaco' | 'lua' | 'escuro'      hora: 'dia' | 'tarde' | 'noite'      casa: true (no quintal)
//   personagem: { tipo: 'menino' | 'menina', roupa: 'camiseta' | 'moletom', cores: { camiseta, bermuda, ... }, capacete: 'obra' | 'espaco' }
//   objeto: { pecas: [...], destaque: nº da peça com o círculo vermelho na capa, plaquinha: 'SEGUE O\nCANAL!',
//             assinatura: 'aneis' (anéis dourados no "por dentro") | omitido, ajudante: 'sonda' | omitido }
//   peça: { nome, forma, tam, cor, pos, giro (graus), brilho, transparente (0 a 1), metal, pontos (cano), texto (placa), kit }
//     formas: caixa [larg, alt, prof] · cilindro [raio, alt] ou [raioCima, raioBaixo, alt] · tubo [raio, alt] (oco)
//             funil [raioCima, raioBaixo, alt] · esfera [raio] · cone [raio, alt] · anel [raio, grossura]
//             cano (pontos: [[x,y,z],...], tam: [raio]) · placa (texto, tam: [larg, alt]) · kit (kit: 'carro', 'arvore', 'balde', ...)
//   frases[].plano:
//     gancho      a capa ganhando vida (objeto inteiro, câmera chegando)
//     problema    o que dá errado sem a próxima peça (etiqueta vermelha, personagem sofrendo)
//     monta       a peça (peca: nº ou lista) cai do céu e encaixa
//     nome        "Esse é o X": rótulo amarelo na peça (peca)
//     mostra      o objeto funcionando, câmera girando em volta
//     por_fora    o objeto inteiro    por_dentro    as peças se afastam (vista explodida)
//     segue       plaquinha + logo    cartao        (cauda) o personagem acena
//   opcionais por frase: peca, etiqueta, cor ('verde', 'vermelho', 'azul', 'laranja', 'amarelo'), marca ('certo' | 'errado'),
//     humor ('feliz', 'triste', 'surpreso', 'bravo', 'assustado'), acao ('cair', 'suar', 'pensar', 'pular', 'comemorar', 'apontar', 'acenar'),
//     contador: { texto, sub }, efeito: { tipo: 'luz' | 'fogo' | 'fumaca' | 'vapor' | 'agua' | 'brilho' | 'chuva' | 'vento' | 'festa',
//     peca, forca (0 a 1), mantem: true (continua nas próximas frases) }, apaga: 'luz' (ou outro tipo, ou 'tudo')
(function () {
  const TAN_V = Math.tan((25 * Math.PI) / 180), TAN_H = TAN_V * (9 / 16);
  const FINAIS = ['por_dentro', 'segue', 'cartao'];

  let R, tl, bl, objeto, pecas = [], estados = [], efeitosFrase = [], efeitosFinais = [];
  let menino, plaquinha, chaoLua, M, PLAQ, caixaObj;
  const fx = {}, rotulos = {}, etiquetas = {};
  const v3 = new THREE.Vector3(), cx = new THREE.Box3();

  const lista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const corDe = (c, padrao) => (c == null ? padrao : typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16));
  const rad = (g) => (g || [0, 0, 0]).map((x) => (x * Math.PI) / 180);
  const temChao = () => !['espaco', 'escuro'].includes(R.lugar);
  // Instante da palavra dentro do bloco (se não estiver nele, usa a fração fr do bloco)
  const quando = (palavra, B, fr = 0.5) => {
    const t = palavra ? K.quando(palavra, B.inicio) : null;
    return t != null && t < B.ate ? t : B.inicio + fr * (B.ate - B.inicio);
  };
  const termo = (f) => { const m = (f.marcado || '').match(/\*([^*]+)\*/); return m ? m[1] : null; };

  // ---------- Peças ----------

  function criarKit(p, cor, t) {
    const k = {
      casa: () => K.casa(), arvore: () => K.arvore(0, 0, 1, false, K.rand(3)), pinheiro: () => K.arvore(0, 0, 1, true, K.rand(3)),
      carro: () => K.carro(cor), tambor: () => K.tambor(cor), balde: () => K.balde(cor).g, regador: () => K.regador(cor).g,
      flor: () => K.flor(cor).g, computador: () => K.computador().g, celular: () => K.celular().g, bicicleta: () => K.bicicleta(cor).g,
      satelite: () => K.satelite(), navio: () => K.navio().g, foguete: () => K.foguete().g, moduloLunar: () => K.moduloLunar().g,
      capsula: () => K.capsula().g, terra: () => K.planeta('terra', t[0] || 1).g, lua: () => K.planeta('lua', t[0] || 1).g,
      balao: () => K.balao(cor), torneira: () => K.torneira([0, 0, 0]).g, registro: () => K.registro().g,
      predio: () => K.predio(t[0] || 10, t[1] || 4, t[2] || 4).g, peixe: () => { const x = K.peixe(cor); x.em([0, 0, 0], 0); return x.g; }
    }[p.kit];
    if (!k) throw new Error(`Peça de kit desconhecida: "${p.kit}"`);
    return k();
  }

  function criarPeca(p) {
    const cor = corDe(p.cor, 0xcfd3d8);
    // Metal sem reflexo de ambiente sai escuro: metalness baixo e superfície lisa já dão cara de metal
    const op = { roughness: p.metal ? 0.32 : 0.7, metalness: p.metal ? 0.25 : 0 };
    if (p.transparente) Object.assign(op, { transparent: true, opacity: 1 - p.transparente, depthWrite: false });
    if (p.brilho) Object.assign(op, { emissive: cor, emissiveIntensity: typeof p.brilho === 'number' ? p.brilho : 0.8 });
    const aberto = ['tubo', 'funil'].includes(p.forma);
    if (aberto) op.side = THREE.DoubleSide;
    const mat = K.mat(cor, op);
    const t = p.tam || [];
    let obj;
    switch (p.forma) {
      case 'caixa': obj = K.malha(new THREE.BoxGeometry(t[0] || 1, t[1] || t[0] || 1, t[2] || t[0] || 1), mat); break;
      case 'cilindro': obj = K.malha(t.length >= 3 ? new THREE.CylinderGeometry(t[0], t[1], t[2], 24) : new THREE.CylinderGeometry(t[0] || 0.5, t[0] || 0.5, t[1] || 1, 24), mat); break;
      case 'tubo': obj = K.malha(new THREE.CylinderGeometry(t[0] || 0.5, t[0] || 0.5, t[1] || 1, 24, 1, true), mat); break;
      case 'funil': obj = K.malha(new THREE.CylinderGeometry(t[0] || 0.6, t[1] || 0.2, t[2] || 0.5, 24, 1, true), mat); break;
      case 'esfera': obj = K.malha(new THREE.SphereGeometry(t[0] || 0.5, 22, 16), mat); break;
      case 'cone': obj = K.malha(new THREE.ConeGeometry(t[0] || 0.5, t[1] || 1, 22), mat); break;
      case 'anel': obj = K.malha(new THREE.TorusGeometry(t[0] || 0.5, t[1] || 0.08, 10, 36).rotateX(Math.PI / 2), mat); break;
      case 'cano': obj = K.cano(p.pontos || [[0, 0, 0], [0, 1, 0]], t[0] || 0.06, cor).g; break;
      case 'placa': obj = K.placa(p.texto || p.nome || '', { larg: t[0] || 1, alt: t[1] || 0.5 }); break;
      case 'kit': obj = criarKit(p, cor, t); break;
      default: throw new Error(`Forma desconhecida na peça "${p.nome}": ${p.forma}`);
    }
    const g = new THREE.Group();
    g.add(obj);
    g.position.set(...(p.pos || [0, 0, 0]));
    g.rotation.set(...rad(p.giro));
    objeto.add(g);
    return g;
  }

  // ---------- Montagem ----------

  function montar(timeline) {
    tl = timeline;
    R = tl.roteiro || {};
    R.lugar = R.lugar || 'quintal';
    R.objeto = R.objeto || { pecas: [] };
    // Um bloco por frase (o K.blocos junta frases seguidas com o mesmo plano; aqui cada frase tem a sua peça)
    bl = tl.frases.map((f, i) => ({ plano: f.plano, inicio: f.inicio, fim: f.fim, reb: f.reb || 0, frase: i }));
    bl.forEach((b, i) => { b.ate = i + 1 < bl.length ? bl[i + 1].inicio : tl.total; });
    montarLugar();

    objeto = new THREE.Group();
    K.scene.add(objeto);
    pecas = R.objeto.pecas.map((p, i) => ({ p, i, g: criarPeca(p) }));
    // Centraliza o objeto na origem e apoia no chão
    objeto.updateMatrixWorld(true);
    cx.setFromObject(objeto);
    const c = cx.getCenter(new THREE.Vector3());
    objeto.position.set(-c.x, temChao() ? -Math.min(0, cx.min.y) : -c.y + 1.2, -c.z);
    objeto.updateMatrixWorld(true);
    caixaObj = new THREE.Box3().setFromObject(objeto);
    const nP = pecas.length, oc0 = caixaObj.getCenter(new THREE.Vector3()), os0 = caixaObj.getSize(new THREE.Vector3());
    const passo = Math.max(os0.x, os0.z, os0.y * 0.45) * 0.75 + 0.25;
    // Objeto alto (cabe melhor no 9:16): as peças se empilham pra cima, com espaço entre elas; objeto largo: ficam em fila
    const vertical = os0.y >= os0.x * 0.8;
    const ordem = pecas.map((x, i) => i);
    pecas.forEach((x) => {
      x.casa = x.g.position.clone();
      x.rot = x.g.rotation.clone();
      x.caixa = new THREE.Box3().setFromObject(x.g);
      x.centro = x.caixa.getCenter(new THREE.Vector3());
      x.tam = x.caixa.getSize(new THREE.Vector3());
      if (!vertical && !x.p.fixa) {
        const alvoX = oc0.x + (x.i - (nP - 1) / 2) * passo, alvoY = Math.max(oc0.y + os0.y * 0.15, x.tam.y / 2 + 0.25);
        x.desloca = [alvoX - x.centro.x, alvoY - x.centro.y, 0.5 + 0.12 * (x.i % 2)];
      }
      x.giro = [0.25, 0.6, 0.15].map((v, k) => v * (((x.i + k) % 3) - 1 || 0.5));
      x.lado = x.i % 2 ? 1 : -1;
    });
    pecas.forEach((x) => { if (x.p.fixa) x.desloca = [0, 0, 0]; });
    if (vertical) {
      // Pilha de baixo pra cima, na ordem da altura original; cada peça um pouco pro lado, alternando.
      // As peças fixas (fogão, mesa, base) ficam no lugar e a pilha começa em cima delas
      const soltas = ordem.filter((n) => !pecas[n].p.fixa);
      const topoFixas = Math.max(0, ...pecas.filter((x) => x.p.fixa).map((x) => x.caixa.max.y));
      ordem.length = 0;
      ordem.push(...soltas);
      ordem.sort((a, b) => pecas[a].centro.y - pecas[b].centro.y);
      const vao = Math.max(0.25, os0.y * 0.12);
      let y = topoFixas + 0.3;
      ordem.forEach((n, k) => {
        const x = pecas[n];
        x.lado = k % 2 ? 1 : -1;
        const alvoY = y + x.tam.y / 2;
        y += x.tam.y + vao;
        x.desloca = [oc0.x + x.lado * os0.x * 0.18 - x.centro.x, alvoY - x.centro.y, 0.4];
      });
    }

    // Quais peças existem em cada frase: as montadas antes + as que caem nela. Peça nunca montada está sempre lá
    const montadas = new Set();
    tl.frases.forEach((f) => { if (f.plano === 'monta') lista(f.peca).forEach((n) => montadas.add(n)); });
    const ja = new Set(pecas.map((x) => x.i).filter((i) => !montadas.has(i)));
    estados = tl.frases.map((f) => {
      const antes = new Set(ja);
      const novas = f.plano === 'monta' ? lista(f.peca) : [];
      novas.forEach((n) => ja.add(n));
      return { antes, novas, depois: new Set(ja) };
    });
    // Efeitos: os da frase + os que ficaram ligados (mantem); o mais novo de cada tipo vale
    let mantidos = [];
    efeitosFrase = tl.frases.map((f) => {
      if (f.apaga) mantidos = f.apaga === 'tudo' ? [] : mantidos.filter((e) => e.tipo !== f.apaga);
      const proprios = lista(f.efeito);
      const ativos = dedup([...mantidos, ...proprios]);
      proprios.filter((e) => e.mantem).forEach((e) => { mantidos = dedup([...mantidos, e]); });
      return FINAIS.includes(f.plano) ? [] : ativos;
    });
    efeitosFinais = dedup(mantidos);

    // Personagem e plaquinha: personagem à direita do objeto, plaquinha à esquerda
    const per = R.personagem || {};
    const cores = {};
    Object.entries(per.cores || {}).forEach(([k, v]) => { cores[k] = corDe(v); });
    // Os mesmos nomes de cor valem pra qualquer roupa (o kit usa nomes diferentes pra menina e pro moletom)
    if (cores.cabelo != null && per.tipo === 'menina') cores.cabeloMenina = cores.cabelo;
    if (cores.tenis != null && per.roupa === 'moletom') cores.tenisBranco = cores.tenis;
    menino = K.boneco({ tipo: per.tipo, roupa: per.roupa, cores });
    const os = caixaObj.getSize(new THREE.Vector3());
    M = [caixaObj.max.x + 0.75, 0, caixaObj.max.z + 0.25];
    PLAQ = [caixaObj.min.x - 0.85, 0, caixaObj.max.z + 0.35];
    plaquinha = K.plaquinha(R.objeto.plaquinha || 'SEGUE O\nCANAL!');
    plaquinha.visible = false;

    fx.feixe = feixe();
    fx.halo = K.halo(0xfff2a0, 2);
    fx.fogo = K.fogo(14);
    fx.fumaca = K.fumaca(15, 0x3a3a3a, 18);
    fx.vapor = K.fumaca(16, 0xffffff, 16);
    fx.jato = K.jato(0.06);
    fx.chuva = K.chuva(12);
    fx.vento = K.vento(13);
    fx.festa = K.festa([M[0] - 0.4, 0, M[2] + 0.2]);
    fx.poeira = K.poeira(1);
    fx.poeira2 = K.poeira(2);
    fx.certo = K.marca('certo');
    fx.errado = K.marca('errado');
    fx.contador = K.contador();
    fx.circulo = K.circulo();
    fx.logo = window.LOGO ? K.logoFinal() : null;
    fx.sonda = R.objeto.ajudante === 'sonda' ? K.sonda() : null;
    fx.aneis = R.objeto.assinatura === 'aneis' ? K.desconstrucao(9) : null;
    if (fx.aneis) pecas.forEach((x) => fx.aneis.peca(x.g, [0, 0, 0]));
    fx.dq = pecas.map((x) => K.destaque(x.g));
    fx.nomes = pecas.map((x) => K.etiqueta(x.p.nome || `peça ${x.i + 1}`, ['azul', 'laranja', 'verde', 'roxo', 'vermelho'][x.i % 5]));
    tl.frases.forEach((f, i) => {
      if (f.etiqueta) etiquetas[i] = K.etiqueta(f.etiqueta, f.cor || (f.plano === 'problema' ? 'vermelho' : f.plano === 'monta' ? 'verde' : 'azul'));
      if (f.plano === 'nome') rotulos[i] = K.rotulo(quebra(f.rotulo || termo(f) || (pecas[lista(f.peca)[0]] || { p: {} }).p.nome || ''));
    });
  }
  // Rótulo com mais de 12 letras quebra em duas linhas, no espaço mais perto do meio (senão corta na borda da tela)
  function quebra(t) {
    if (t.length <= 12 || !t.includes(' ')) return t;
    const meio = t.length / 2;
    let melhor = -1;
    for (let k = 0; k < t.length; k++) if (t[k] === ' ' && (melhor < 0 || Math.abs(k - meio) < Math.abs(melhor - meio))) melhor = k;
    return t.slice(0, melhor) + '<br>' + t.slice(melhor + 1);
  }
  function dedup(l) { const m = new Map(); l.forEach((e) => m.set(e.tipo, e)); return [...m.values()]; }

  // ---------- Lugar ----------

  function montarLugar() {
    if (R.lugar === 'quintal' || R.lugar === 'praia') {
      const mundo = K.mundo(21);
      mundo.children.forEach((c) => { if (c.isGroup && c.position.y === 0 && Math.abs(c.position.x) < 12 && c.position.z > -14) c.visible = false; });
      if (R.casa) { const c = K.casa(); c.position.set(-7, 0, -9); c.rotation.y = 0.3; }
      if (R.lugar === 'praia') {
        const agua = K.malha(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), K.mat(0x2f8fd8, { roughness: 0.2, metalness: 0.1 }), false);
        agua.position.set(0, 0.05, -212);
        const areia = K.malha(new THREE.BoxGeometry(400, 0.06, 14), K.mat(0xe8d49a), false);
        areia.position.set(0, 0.0, -6);
        K.scene.add(agua, areia);
      }
    } else if (R.lugar === 'cozinha') {
      // Cozinha: piso de lajotas, duas paredes (fundo e esquerda), janela, bancada e armário em cima
      const g = new THREE.Group();
      const piso = K.malha(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), K.mat(0xd9cbb4), false);
      piso.receiveShadow = true;
      g.add(piso);
      const linhas = new THREE.MeshBasicMaterial({ color: 0xbfae94 });
      for (let i = -14; i <= 14; i += 1.2) {
        const a = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 30).rotateX(-Math.PI / 2), linhas);
        a.position.set(i, 0.005, 0);
        const b = new THREE.Mesh(new THREE.PlaneGeometry(30, 0.03).rotateX(-Math.PI / 2), linhas);
        b.position.set(0, 0.005, i);
        g.add(a, b);
      }
      const parede = (l, a, x, z, ry, cor) => {
        const m = K.malha(new THREE.BoxGeometry(l, a, 0.2), K.mat(cor), false);
        m.position.set(x, a / 2, z);
        m.rotation.y = ry;
        m.castShadow = false;
        g.add(m);
        return m;
      };
      parede(30, 4.2, 0, -3.2, 0, 0xf2e6cf);
      parede(30, 4.2, -5.5, 0, Math.PI / 2, 0xeadcc2);
      const azulejo = K.malha(new THREE.BoxGeometry(30, 1.2, 0.05), K.mat(0x8fc7c0), false);
      azulejo.position.set(0, 1.55, -3.08);
      const janela = K.malha(new THREE.BoxGeometry(1.8, 1.2, 0.06), new THREE.MeshBasicMaterial({ color: 0xbfe3ff }), false);
      janela.position.set(2.6, 2.6, -3.06);
      const moldura = K.malha(new THREE.BoxGeometry(2.0, 1.4, 0.04), K.mat(0xffffff), false);
      moldura.position.set(2.6, 2.6, -3.08);
      const bancada = K.malha(new THREE.BoxGeometry(5, 0.95, 0.8), K.mat(0x7a5236));
      bancada.position.set(-2.6, 0.475, -2.6);
      const pedra = K.malha(new THREE.BoxGeometry(5.1, 0.06, 0.86), K.mat(0x3a3f48));
      pedra.position.set(-2.6, 0.98, -2.6);
      const armario = K.malha(new THREE.BoxGeometry(3.2, 0.9, 0.5), K.mat(0x7a5236), false);
      armario.position.set(-3.4, 3.2, -2.85);
      g.add(azulejo, moldura, janela, bancada, pedra, armario);
      K.scene.add(g);
    } else if (R.lugar === 'lua') {
      chaoLua = K.malha(new THREE.CircleGeometry(170, 60).rotateX(-Math.PI / 2), K.mat(0xa9a9ae), false);
      chaoLua.receiveShadow = true;
      K.scene.add(chaoLua);
      const terra = K.planeta('terra', 8, 4);
      terra.g.position.set(-28, 44, -125);
    } else if (R.lugar === 'espaco') {
      const terra = K.planeta('terra', 60, 4);
      terra.g.position.set(0, -75, -40);
    }
  }
  function ceu() {
    const h = R.hora || 'dia';
    if (R.lugar === 'espaco') K.ceu('espaco');
    else if (R.lugar === 'lua') K.ceu('lua');
    else if (R.lugar === 'cozinha') K.ceu('dia');
    else if (R.lugar === 'escuro') K.ceu('escuro');
    else if (h === 'noite') K.ceu('noite', 'tarde', 0.28);
    else if (h === 'tarde') K.ceu('dia', 'tarde', 0.85);
    else K.ceu('dia');
    K.neblina(60, 220, 600);
  }

  // Feixe de luz (lanterna, farol, holofote): cone que abre a partir de um ponto
  function feixe() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 28, 1, true).translate(0, -0.5, 0), mat);
    m.visible = false;
    K.scene.add(m);
    const de = new THREE.Vector3(), d = new THREE.Vector3(), baixo = new THREE.Vector3(0, -1, 0);
    return K.componente({
      esconder() { m.visible = false; },
      em(origem, dir, comp, larg, forca, t) {
        if (forca <= 0.01) return;
        m.visible = true;
        de.set(...origem);
        d.set(...dir).normalize();
        m.position.copy(de);
        m.quaternion.setFromUnitVectors(baixo, d);
        m.scale.set(larg, comp, larg);
        mat.opacity = (0.22 + 0.06 * Math.sin(t * 7)) * forca;
      }
    });
  }

  // ---------- Ajudantes de quadro ----------

  const mundoDe = (x, local) => K.noMundo(x.g, local);
  const topo = (x) => [x.centro.x, x.caixa.max.y, x.centro.z];
  const fundo = (x) => [x.centro.x, x.caixa.min.y, x.centro.z];
  const centro = (x) => [x.centro.x, x.centro.y, x.centro.z];

  function caixaDe(indices, comMenino = true, comPlaquinha = false) {
    const b = new THREE.Box3();
    indices.forEach((i) => b.union(pecas[i].caixa));
    if (b.isEmpty()) b.copy(caixaObj);
    if (comMenino) b.union(new THREE.Box3(new THREE.Vector3(M[0] - 0.4, 0, M[2] - 0.3), new THREE.Vector3(M[0] + 0.4, 1.55, M[2] + 0.3)));
    if (comPlaquinha) b.union(new THREE.Box3(new THREE.Vector3(PLAQ[0] - 0.8, 0, PLAQ[2] - 0.2), new THREE.Vector3(PLAQ[0] + 0.8, 1.6, PLAQ[2] + 0.2)));
    return b;
  }
  // Câmera que enquadra a caixa b no 9:16, olhando de um ângulo (az, el em radianos), com folga zoom
  function vista(b, az = 0, el = 0.12, zoom = 1.25) {
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    const d = Math.max(s.y / 2 / TAN_V, Math.max(s.x, s.z * 0.6) / 2 / TAN_H) * zoom + Math.max(s.x, s.z) * 0.5;
    const pos = [c.x + Math.sin(az) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.cos(az) * Math.cos(el) * d];
    if (temChao()) pos[1] = Math.max(0.5, pos[1]);
    return { pos, alvo: [c.x, c.y, c.z] };
  }
  const cam = (de, ate, p) => K.plano(de, ate, p);

  function noMenino(tc, olhar = null) {
    menino.g.visible = true;
    menino.g.position.set(...M);
    const oc = caixaObj.getCenter(new THREE.Vector3());
    const r = Math.atan2(oc.x - M[0], oc.z - M[2]);
    menino.g.rotation.y = olhar != null ? olhar : r * 0.55; // meio virado pro objeto, meio pra câmera
    menino.reset(tc);
    const per = R.personagem || {};
    if (per.capacete === 'obra') menino.capacete();
    if (per.capacete === 'espaco') menino.capaceteEspacial();
  }
  function acao(f, tc, B, padrao) {
    const a = f.acao || padrao;
    const x = K.faixa(tc, B.inicio + 0.15 * B.dur, B.inicio + 0.6 * B.dur);
    if (a === 'cair') { if (x > 0) menino.cair(x); }
    else if (a === 'suar') { menino.suar(tc); menino.humor('triste'); }
    else if (a === 'pensar') menino.pensar();
    else if (a === 'pular') menino.pular(K.faixa(tc, B.inicio, B.inicio + 0.8), 0.5);
    else if (a === 'comemorar') menino.comemorar(tc);
    else if (a === 'apontar') menino.apontar(0.6);
    else if (a === 'acenar') menino.acenar(tc);
    if (f.humor) menino.humor(f.humor);
  }

  // Liga as peças da lista e devolve as visíveis
  function mostrarPecas(conj) {
    pecas.forEach((x) => {
      x.g.visible = conj.has(x.i);
      x.g.position.copy(x.casa);
      x.g.rotation.copy(x.rot);
    });
  }

  function efeitosEm(lista_, tc, B) {
    lista_.forEach((e) => {
      const x = pecas[e.peca != null ? e.peca : 0];
      if (!x || !x.g.visible) return;
      const forca = e.forca != null ? e.forca : 1;
      const s = Math.max(x.tam.x, x.tam.z, 0.3), o = caixaObj.getSize(new THREE.Vector3());
      switch (e.tipo) {
        case 'luz': {
          const comp = Math.max(3, o.y * 2.2) * (0.5 + 0.5 * forca);
          fx.feixe.em(topo(x), e.dir || [0, 1, 0], comp, comp * 0.32, forca, tc);
          fx.halo.visible = true;
          fx.halo.position.set(...centro(x));
          fx.halo.scale.setScalar(s * 4 * (0.4 + 0.6 * forca));
          fx.halo.material.opacity = 0.9 * forca;
          K.som('liga', B.inicio, 0.4);
          break;
        }
        case 'brilho':
          fx.halo.visible = true;
          fx.halo.position.set(...centro(x));
          fx.halo.scale.setScalar(s * 3 * (0.85 + 0.15 * Math.sin(tc * 6)));
          fx.halo.material.opacity = 0.8 * forca;
          break;
        case 'fogo': fx.fogo.em(topo(x), tc, e.escala || Math.max(0.5, s), forca); K.som('fogo', B.inicio, 0.3, B.dur); break;
        case 'fumaca': fx.fumaca.em(topo(x), tc, { altura: 3, escala: e.escala || Math.max(0.5, s), forca }); break;
        case 'vapor': fx.vapor.em(topo(x), tc, { altura: e.altura || 2, escala: e.escala || Math.max(0.4, s * 0.7), forca, ritmo: 0.5 }); K.som('vapor', B.inicio, 0.3); break;
        case 'agua': { const f0 = fundo(x); fx.jato.em(f0, Math.max(0.1, f0[1]), tc, forca); K.som('agua', B.inicio, 0.35, B.dur); break; }
        case 'chuva': fx.chuva.em([0, 0, -5], tc, forca); break; // atrás do objeto: nada de gota grudada na câmera
        case 'vento': fx.vento.em([0, 0, 0], tc, forca); break;
        case 'festa': fx.festa.em(tc - B.inicio); break;
        default: break;
      }
    });
  }

  // ---------- Planos ----------

  const P = {
    gancho(B, tc, f, i) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      efeitosEm(efeitosFinais, tc, B);
      layoutCapa(B.p, tc);
      K.som('whoosh', B.inicio + 0.1, 0.5);
    },

    problema(B, tc, f, i) {
      mostrarPecas(estados[i].antes);
      efeitosEm(efeitosFrase[i], tc, B);
      noMenino(tc);
      menino.humor('triste');
      acao(f, tc, B, estados[i].antes.size ? 'suar' : 'cair');
      const tE = B.inicio + 0.45 * B.dur;
      if (etiquetas[i]) etiquetas[i].em({ tela: [540, 430] }, tc - tE);
      if (f.marca !== 'certo') { fx.errado.em({ tela: [540, 560] }, tc - tE - 0.2); K.som('errado', tE + 0.2, 0.6); }
      if (f.contador) fx.contador.em(f.contador.texto, { tela: [540, 560] }, tc - tE, f.contador.sub || '');
      const b = caixaDe(estados[i].antes.size ? [...estados[i].antes] : [], true);
      const az = i % 2 ? -0.3 : 0.3;
      cam(vista(b, az, 0.14, 1.3), vista(b, az * 0.7, 0.12, 1.12), B.p);
    },

    monta(B, tc, f, i) {
      const novas = estados[i].novas;
      mostrarPecas(estados[i].depois);
      efeitosEm(efeitosFrase[i], tc, B);
      novas.forEach((n, k) => {
        const x = pecas[n];
        if (!x) return;
        const nome = (x.p.nome || '').split(/\s+/)[0];
        const t0 = quando(nome, B, 0.3) - 0.35 + k * 0.3;
        x.g.visible = tc >= t0;
        x.g.position.y += K.queda(tc - t0, Math.max(4, caixaObj.getSize(v3).y * 2.5), 0.6);
        const imp = t0 + 0.6 * K.QUICA_IMPACTO;
        K.som('whoosh', t0, 0.4);
        K.som(x.p.som || (x.p.metal ? 'metal' : x.tam.y > 1.5 ? 'baque' : 'tampa'), imp, 0.9);
        if (temChao() && x.caixa.min.y < 0.3) fx.poeira.em([x.centro.x, 0, x.centro.z], tc - imp, Math.max(0.8, x.tam.x * 1.5));
        fx.dq[n].em(tc - imp, 1.4);
        if (k === 0 && etiquetas[i]) etiquetas[i].em({ tela: [540, 430] }, tc - imp - 0.3);
      });
      noMenino(tc);
      acao(f, tc, B, 'apontar');
      menino.humor('surpreso');
      if (f.marca === 'certo') { fx.certo.em({ tela: [540, 560] }, tc - B.inicio - 0.7 * B.dur); K.som('certo', B.inicio + 0.7 * B.dur, 0.6); }
      if (f.contador) fx.contador.em(f.contador.texto, { tela: [540, 560] }, tc - B.inicio - 0.5 * B.dur, f.contador.sub || '');
      const b = caixaDe([...estados[i].depois], true);
      const az = i % 2 ? 0.25 : -0.25;
      cam(vista(b, az, 0.2, 1.15), vista(b, az * 0.6, 0.15, 1.3), B.p);
    },

    nome(B, tc, f, i) {
      mostrarPecas(estados[i].depois);
      efeitosEm(efeitosFrase[i], tc, B);
      const n = lista(f.peca)[0] != null ? lista(f.peca)[0] : [...estados[i].depois].pop();
      const x = pecas[n];
      noMenino(tc);
      menino.humor('feliz');
      menino.apontar(0.6);
      if (x) {
        fx.dq[n].em(B.t, 1.6);
        if (rotulos[i]) rotulos[i].em([x.centro.x, x.caixa.max.y + 0.35, x.centro.z], B.t - 0.05);
        // Close na peça com um pouco de contexto (peça pequena ganha mais margem; peça larga, quase nenhuma)
        const m = Math.max(x.tam.x, x.tam.y, x.tam.z);
        const b = new THREE.Box3().copy(x.caixa).expandByScalar(Math.max(0.35, 0.9 - m * 0.3));
        b.max.y += 0.45;
        cam(vista(b, 0.15, 0.15, 1.15), vista(b, 0.05, 0.12, 1.02), B.p);
      } else cam(vista(caixaObj, 0.1), vista(caixaObj, 0), B.p);
    },

    mostra(B, tc, f, i) {
      mostrarPecas(estados[i].depois);
      efeitosEm(efeitosFrase[i], tc, B);
      noMenino(tc);
      acao(f, tc, B, 'comemorar');
      if (etiquetas[i]) etiquetas[i].em({ tela: [540, 430] }, tc - B.inicio - 0.3 * B.dur);
      if (f.contador) fx.contador.em(f.contador.texto, { tela: [540, 560] }, tc - B.inicio - 0.4 * B.dur, f.contador.sub || '');
      if (f.marca) { fx[f.marca === 'certo' ? 'certo' : 'errado'].em({ tela: [540, 560] }, tc - B.inicio - 0.6 * B.dur); }
      const b = caixaDe([...estados[i].depois], true);
      cam(vista(b, -0.45, 0.15, 1.2), vista(b, 0.45, 0.2, 1.2), B.p);
    },

    por_fora(B, tc, f, i) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      efeitosEm(efeitosFinais, tc, B);
      noMenino(tc);
      acao(f, tc, B, 'apontar');
      const b = caixaDe(pecas.map((x) => x.i), true);
      cam(vista(b, 0.0, 0.08, 1.35), vista(b, 0.08, 0.1, 1.2), B.p);
    },

    por_dentro(B, tc, f, i) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      const e = abrir(tc, B.inicio + 0.2, B.ate - B.inicio);
      noMenino(tc);
      menino.humor('surpreso');
      menino.apontar(0.8);
      K.som(fx.aneis ? 'desconstrucao' : 'whoosh', B.inicio + 0.2, fx.aneis ? 0.9 : 0.6);
      // Nome de cada peça aparecendo enquanto ela sai
      pecas.forEach((x, k) => {
        if (x.p.fixa) return;
        const t0 = B.inicio + 0.4 + (k / Math.max(1, pecas.length)) * 0.75 * B.dur;
        const pc = new THREE.Box3().setFromObject(x.g).getCenter(new THREE.Vector3());
        fx.nomes[k].em([pc.x + x.lado * (Math.max(x.tam.x, 0.3) / 2 + 0.75), pc.y, pc.z + 0.1], tc - t0);
        K.som('brilho', t0, 0.25);
      });
      const b = caixaExplodida(e);
      cam(vista(b, 0.0, 0.1, 1.15), vista(b, 0.1, 0.12, 1.08), B.p);
    },

    segue(B, tc, f, i) { final(B, tc, f, false); },
    cartao(B, tc, f, i) { final(B, tc, f, true); },

    // Capa: objeto inteiro com o círculo na peça destaque e o personagem do lado, apontando
    capa(B, tc) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      efeitosEm(efeitosFinais, 0, { inicio: -1, dur: 1 });
      layoutCapa(0, 0);
    }
  };

  // Abre as peças (vista explodida) de t0 até t0 + dur; devolve o quanto abriu
  function abrir(tc, t0, dur) {
    const e = K.saiVolta(K.faixa(tc, t0, t0 + Math.min(1.4, dur * 0.4)));
    pecas.forEach((x, k) => {
      if (x.p.fixa) return;
      const ek = K.saiVolta(K.faixa(tc, t0 + (k / Math.max(1, pecas.length)) * 0.6 * dur, t0 + (k / Math.max(1, pecas.length)) * 0.6 * dur + 0.7));
      const bob = Math.sin(tc * 1.6 + k) * 0.04 * ek;
      x.g.position.set(x.casa.x + x.desloca[0] * ek, x.casa.y + x.desloca[1] * ek + bob, x.casa.z + x.desloca[2] * ek);
      x.g.rotation.set(x.rot.x + x.giro[0] * ek * Math.sin(tc * 0.5 + k), x.rot.y + x.giro[1] * ek * tc * 0.3, x.rot.z + x.giro[2] * ek);
    });
    const oc = caixaObj.getCenter(new THREE.Vector3()), os = caixaObj.getSize(new THREE.Vector3());
    if (fx.aneis) fx.aneis.em(e, tc, { centro: [oc.x, oc.y, oc.z], escala: Math.max(os.x, os.y) / 3.2, pecas: pecas.map(() => 0) });
    if (fx.sonda) fx.sonda.em([M[0] - 0.4, 1.7, M[2] + 0.3], tc, [oc.x, oc.y, oc.z], e > 0.05 && e < 0.98 ? Math.max(os.x, os.y) * 0.5 : 0);
    return e;
  }
  function caixaExplodida(e) {
    const b = new THREE.Box3();
    pecas.forEach((x) => { b.union(new THREE.Box3().setFromObject(x.g)); });
    b.union(caixaDe([], true));
    return b;
  }

  function final(B, tc, f, cauda) {
    mostrarPecas(new Set(pecas.map((x) => x.i)));
    efeitosEm(efeitosFinais, tc, B);
    if (fx.aneis) abrir(tc, -10, 3);
    const t0 = cauda ? B.inicio - 3 : quando('segue', B, 0.1);
    plaquinha.visible = true;
    plaquinha.position.set(PLAQ[0], K.queda(tc - t0 + 0.1, 6, 0.5), PLAQ[2]);
    plaquinha.rotation.y = 0.25;
    K.som('madeira', t0 - 0.1 + 0.5 * K.QUICA_IMPACTO, 0.9);
    if (temChao()) fx.poeira2.em(PLAQ, tc - t0 + 0.1 - 0.5 * K.QUICA_IMPACTO, 0.9);
    noMenino(tc);
    if (cauda) { menino.acenar(tc); K.som('final', B.inicio, 0.7); } else { menino.g.rotation.y = -1.0; menino.apontar(0.15); }
    if (fx.logo) { fx.logo.em(tc - t0); K.som('brilho', t0, 0.5); }
    const b = fx.aneis ? caixaExplodida(1) : new THREE.Box3().copy(caixaObj);
    b.union(caixaDe([], true, true));
    cam(vista(b, 0.0, 0.08, 0.95), vista(b, 0.0, 0.08, 0.88), B.p);
  }

  // Capa e gancho: objeto e personagem lado a lado, chão perto da base da tela, espaço no topo pra pergunta
  function layoutCapa(p, tc) {
    noMenino(tc, -1.05);
    menino.humor('surpreso');
    menino.apontar(0.55);
    menino.cabeca.rotation.y = 0.75;
    const b = caixaDe(pecas.map((x) => x.i), true);
    const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    // A altura do conjunto ocupa ~50% da tela, da linha ~1600 px pra cima
    const vh = Math.max(s.y / 0.5, (s.x * 1.15) / (9 / 16));
    const d = vh / 2 / TAN_V;
    const yBase = b.min.y, pxPorUn = 1920 / vh;
    const yCentro = yBase + (1600 - 960) / pxPorUn;
    const de = { pos: [c.x + d * 0.18, yCentro + 0.1 * d * 0.18, c.z + d], alvo: [c.x, yCentro, c.z] };
    const ate = { pos: [c.x + d * 0.12, yCentro, c.z + d * 0.9], alvo: [c.x, yCentro, c.z] };
    K.plano(de, ate, p);
    const n = R.objeto.destaque != null ? R.objeto.destaque : 0;
    const x = pecas[n];
    if (x) fx.circulo.em(centro(x), Math.min(520, Math.max(220, Math.max(x.tam.x, x.tam.y) * pxPorUn * 1.5)), 1);
  }

  // ---------- Quadro ----------

  function cena(tc, t, plano) {
    const B = plano ? { plano, p: 0, t: 0, dur: 1, inicio: 0, ate: 1, bloco: { frase: 0 } } : K.blocoEm(bl, tc);
    const i = plano ? 0 : B.bloco.frase;
    const f = tl.frases[i] || {};
    ceu();
    K.focoSombra(0, 1);
    menino.g.visible = false;
    plaquinha.visible = false;
    fx.halo.visible = false;
    if (!P[B.plano]) throw new Error(`Plano desconhecido: "${B.plano}" (use gancho, problema, monta, nome, mostra, por_fora, por_dentro, segue)`);
    P[B.plano](B, tc, f, i);
  }

  window.CENA = { montar, cena, capa: () => cena(0, 0, 'capa') };
})();

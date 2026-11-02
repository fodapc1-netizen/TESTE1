# Índice do kit (`motor/kit.js`)

> Gerado a partir dos comentários do kit. Cada item: assinatura, linha no arquivo e o que faz.
> Pra detalhes, abrir o kit na linha. O `cena.js` dos exemplos mostra o uso.

- `K.W()` (linha 19)
- `K.cores()` (linha 21)
- `K.rand(seed)` (linha 34): Aleatório com semente: o vídeo sai igual toda vez que renderiza
- `K.mat(color, opts = {})` (linha 45): Estilo redondo (roteiro.estilo = 'redondo', ligado em K.preparar): sombreamento liso no lugar do facetado
- `K.malha(geo, mat, sombra = true)` (linha 48)
- `K.clamp(x, a = 0, b = 1)` (linha 107): Curvas de tempo
- `K.lerp(a, b, x)` (linha 108)
- `K.faixa(p, a, b)` (linha 109)
- `K.suave(x)` (linha 110)
- `K.suavissimo(x)` (linha 111)
- `K.saiVolta(x)` (linha 112)
- `K.quica(x)` (linha 113)
- `K.pulso(x)` (linha 121)
- `K.queda(tempo, altura = 8, dur = 0.7)` (linha 125): Peça caindo do céu e quicando: deslocamento em y (altura → 0)
- `K.componente(c)` (linha 129)
- `K.vivo(fn)` (linha 134)
- `K.manchaSombra(raio = 0.5, forca = 0.45)` (linha 150)

## Céu, hora do dia e luz

- `K.ceus()` (linha 229)
- `K.ceu(a, b, x = 0)` (linha 281): Mistura duas predefinições de céu: K.ceu('dia', 'tarde', 0.5)
- `K.sombraEm()` (linha 302): Centro da área com sombra (a caixa de sombra do sol tem 32 x 32)
- `K.focoSombra(x, z)` (linha 303)
- `K.init()` (linha 310)
- `K.mirar(pos, alvo, cam = K.camera)` (linha 354)
- `K.plano(de, ate, p, cam = K.camera)` (linha 361): Plano de câmera com movimento leve do começo ao fim do trecho. de/ate: { pos, alvo, fov? }
- `K.tremer(dt, forca = 1, cam = K.camera)` (linha 371): Tremida de impacto: dt = tempo desde o impacto
- `K.neblina(perto = 45, longe = 140, alcance = 400)` (linha 380): Neblina e alcance da câmera (o quadro volta ao padrão sozinho). Palcos grandes vistos do alto pedem mais
- `K.dividir()` (linha 387): Tela dividida: posicionar K.camCima e K.camBaixo e chamar K.dividir() no quadro
- `K.tela(ponto, op = {})` (linha 391)

## Mundo


## Mundo enfeitado (estilo redondo)

- `K.mundo(seed = 7)` (linha 557)
- `K.arvore(x, z, s, pinheiro, r)` (linha 609)
- `K.nuvem(x, y, z, s, r)` (linha 651)
- `K.casa()` (linha 667): Casa padrão: 6 x 3 x 5, frente virada pra +z, cumeeira no eixo x (topo ~ y 4.8). g.userData: { paredes, placas: [frente, fundo], matParede }

## Objetos do dia a dia

- `K.cano(pontos, raio = 0.06, cor = K.cores.cano)` (linha 709): Cano por uma lista de pontos, com cotovelos. c.em(x) faz o cano crescer de 0 a 1 ao longo do caminho.
- `K.placa(texto, op = {})` (linha 771): Placa ou bilhete com texto (textura desenhada em canvas). Plano virado pra +z.
- `K.fluxo(cano, n = 40, cor = K.cores.aguaClara, tam = 1)` (linha 791): Água correndo dentro de um cano (pontinhos claros seguindo o caminho). Deixar o cano translúcido.
- `K.jato(raio = 0.045, cor = K.cores.aguaClara)` (linha 816): Jato caindo de um ponto (fio de água). em(origem, comprimento, t, grossura)
- `K.pingos(seed = 2, n = 6, cor = K.cores.aguaClara)` (linha 835): Gotas pingando de um ponto até o chão. em(origem, t, ritmo (gotas/s), queda (m))
- `K.torneira(pos, comPoste = true)` (linha 861): Torneira de parede ou poste. t.bico = ponto de saída da água (coordenadas locais + posição)
- `K.registro()` (linha 883): Registro (válvula com alavanca vermelha) pra pôr num cano vertical
- `K.balde(cor = 0x3a8fe0)` (linha 898)
- `K.regador(cor = 0x3fae5a)` (linha 914)
- `K.flor(cor = 0xff5a8a)` (linha 933): Flor no vaso. f.em(vida): 0 = murcha, 1 = viva
- `K.tambor(cor = 0x2a6fd6)` (linha 977): Tambor (bombona azul)
- `K.carro(cor = 0xe8352b)` (linha 995): Carro low-poly (frente pra +x)
- `K.predio(andares = 20, larg = 4, prof = 4, cor = 0xd9d2c5, pe = 0.9)` (linha 1024): Prédio com janelas. p.altura = andares * pe; frente pra +z
- `K.mosquito()` (linha 1055)
- `K.folha(cor = 0x6cb548)` (linha 1092)

## Tecnologia, mar e céu

- `K.noMundo(obj, local)` (linha 1107)
- `K.caminho(pontos)` (linha 1115): Caminho por pontos, sem malha (pra coisas que andam sobre fios e trilhas). c.ponto(f), c.total
- `K.halo(cor = 0xfff2a0, tam = 1)` (linha 1138)
- `K.telaCanvas()` (linha 1177)
- `K.computador(op = {})` (linha 1180): Computador (com mesa, se op.mesa !== false). Tela virada pra +z. c.tela.desenhar(...), c.cabo = ponto local de onde sai o fio
- `K.celular()` (linha 1214): Celular (tela pra +z)
- `K.navio(op = {})` (linha 1225): Navio (proa pra +x, linha d'água em y = 0). op: { cor, corCasco, comp, larg, bobina }
- `K.peixe(cor = 0xf7941d, tam = 1)` (linha 1285): Peixe (frente pra +x). em(pos, t, rumo)
- `K.tubarao()` (linha 1323): Tubarão (frente pra +x). em(pos, t, rumo, boca 0..1)
- `K.coqueiro(pos, s = 1, seed = 5)` (linha 1397): Coqueiro inclinado. Base em pos
- `K.satelite()` (linha 1436): Satélite com painéis solares
- `K.bandeira(desenhar, op = {})` (linha 1455): Bandeira no mastro, desenhada em canvas: desenhar(c2, w, h). b.em(t) faz ela tremular
- `K.ondas(cor = 0xffffff, n = 4, abertura = 0.6)` (linha 1487): Ondas saindo de um ponto (grito, Wi-Fi, sinal), viradas pra +x do grupo. em(origem, rumo, t, alcance, ritmo)
- `K.bits(caminho, n = 30, seed = 21, op = {})` (linha 1522): Bits correndo num caminho: bolinhas acesas (1) e apagadas (0), ou só luz (op.soLuz). em(t, vel, ate, desde, forca): forca(f) de 0 a 1 encolhe e apaga cada bit pela posição (sinal enfraquecendo)

## Energia, fogo e fumaça

- `K.bicicleta(cor = 0x2f7fe0)` (linha 1567): Bicicleta (frente pra +z). b.selim = onde o quadril do boneco senta; b.em(t, vel) gira rodas e pedais
- `K.fogo(seed = 14, n = 9)` (linha 1624): Fogo: chamas em cone que tremem. em(pos, t, escala, força 0 a 1)
- `K.fumaca(seed = 15, cor = 0x2a2a2a, n = 18)` (linha 1662): Fumaça ou vapor subindo de um ponto. em(origem, t, op): op = { altura, escala, vento: [x, z], ritmo, forca }

## Espaço

- `K.ligarPontos(m, a, b, raio)` (linha 1698)
- `K.foguete()` (linha 1712): Foguete de 3 estágios (estilo Saturno V), base em y = 0 e ~14,4 de altura. Cada peça é um grupo em f.partes (e1, e2, e3, sla, sm, cm, torre), posto na altura f.base[nome]; a cena move ou solta as peças e chama f.reset() pra empilhar de novo. f.corte(true) tira a metade da frente do casco e mostra os tanques (laranja = combustível, azul = oxigênio líquido) e o módulo lunar guardado no sla. f.nivel(nome, k): líquido dos tanques (1 = cheio). f.bocal[nome]: saída do jato, no espaço da peça
- `K.jatoFoguete(seed = 31)` (linha 1862): Jato de foguete: chama em cone apontando pra −y do grupo, tremendo. em(pos, t, op): op = { comp, larg, forca, quat }
- `K.planeta(tipo = 'terra', raio = 1, seed = 3)` (linha 1897): Terra ou Lua low-poly, com cor por face (sem neblina: dá pra pôr bem longe, no céu). tipo: 'terra' | 'lua'
- `K.moduloLunar()` (linha 1932): Módulo lunar: descida dourada com 4 pernas e subida prateada (a cabine) em cima. Pé das pernas em y = 0. m.amortecer(k): as pernas encolhem no pouso (0 a 1). m.bocalDescida e m.bocalSubida: saída dos jatos (local de m.g / m.subida)
- `K.capsula()` (linha 2000): Cápsula de volta (cone), base em y = 0. c.escudo: a camada marrom embaixo (escudo térmico), c.matCorpo pra esquentar
- `K.paraquedas(cor = 0xf39a1e, cor2 = 0xffffff, alt = 2.6, raio = 1.5)` (linha 2020): Paraquedas: cúpula em faixas e cordas até o ponto de baixo (y = 0 do grupo). p.abrir(k, t, murcho)
- `K.balao(cor = 0xe8352b)` (linha 2058): Balão de aniversário com cordinha (bico pra baixo). Origem no nó

## Boneco

- `K.boneco(op = {})` (linha 2077): op.tipo: 'menino' (padrão, mascote) | 'menina' (vestido vermelho) op.roupa: 'moletom' = roupa do logo (moletom amarelo com capuz, mochila, calça azul-noite, tênis branco)
  - boneco: `b.humor(h)` (linha 2277): humor: 'feliz' | 'triste' | 'surpreso' | 'bravo' | 'nojo' | 'assustado'
  - boneco: `b.pose(esq, dir)` (linha 2291): pose: braços como { x, z, c } por lado (-1 = esquerda da tela quando de frente, 1 = direita)
  - boneco: `b.pernasEm(e, d)` (linha 2297)
  - boneco: `b.parado()` (linha 2298)
  - boneco: `b.reset(t = 0)` (linha 2301): Volta tudo ao neutro e pisca de vez em quando. Chamar no começo de cada quadro.
  - boneco: `b.capacete(cor = 0xf5c518)` (linha 2327)
  - boneco: `b.capaceteEspacial()` (linha 2346)
  - boneco: `b.suar(t)` (linha 2361)
  - boneco: `b.andar(t, vel = 1)` (linha 2384)
  - boneco: `b.correr(t, vel = 1)` (linha 2391)
  - boneco: `b.pular(x, altura = 0.6)` (linha 2404): x de 0 a 1 ao longo do pulo; devolve a altura
  - boneco: `b.cair(x)` (linha 2419): Cai de costas: x de 0 a 1
  - boneco: `b.acenar(t, lado = 1)` (linha 2427)
  - boneco: `b.comemorar(t)` (linha 2432)
  - boneco: `b.segurar()` (linha 2438): Segurando algo com as duas mãos na frente do corpo
  - boneco: `b.apontar(alto = 0.5)` (linha 2440): Apontando com a mão direita (pra cima: alto = 1)
  - boneco: `b.pensar()` (linha 2442): Mão no queixo, pensando
  - boneco: `b.mao(i = 1)` (linha 2445)

## Efeitos de cena

- `K.festa(centro, seed = 3)` (linha 2466): Confete e corações que caem a partir de t0 em volta de um ponto
- `K.poeira(seed = 1, cor = 0xd8ccb4, n = 26)` (linha 2517)
- `K.lascas(seed = 4, cor = 0xc8442f, n = 16)` (linha 2552): Lascas voando (madeira, telha, concreto). em(centro, tempo, chão)
- `K.respingo(seed = 6, cor = K.cores.aguaClara, n = 22)` (linha 2580): Respingo: gotas pra cima + anel na superfície. em(centro, tempo, força)
- `K.esguicho(seed = 8, n = 90, cor = K.cores.aguaClara)` (linha 2615): Esguicho contínuo (cano furado, mangueira). em(origem, direção, velocidade, t, chão)
- `K.chuva(seed = 12, n = 700)` (linha 2645): Chuva em volta de um ponto. em(centro, t, intensidade 0 a 1)
- `K.vento(seed = 13, n = 26)` (linha 2672): Vento: traços brancos passando. em(centro, t, intensidade, direção x)
- `K.destaque(obj)` (linha 2700): Peça nova em amarelo translúcido, como fantasma brilhando. em(tempo desde a apresentação, duração)
- `K.seta(cor = K.cores.vermelho, esp = 1)` (linha 2726): Seta de força 3D. em(origem, direção, comprimento, tempo desde que apareceu)

## Texto e indicadores na tela

- `K.rotulo(texto)` (linha 2770): Nome da peça: amarelo, grande, caixa alta. em(ponto 3D | {tela:[x,y]}, tempo, op)
- `K.etiqueta(texto, cor = 'azul')` (linha 2788): Etiqueta de explicação: pílula branca com ponto colorido (vermelho = problema, verde = funciona)
- `K.marca(tipo = 'certo')` (linha 2805): ✓ verde ou ✗ vermelho. tipo: 'certo' | 'errado'
- `K.contador()` (linha 2822): Cartão branco com número (contador). em(texto, ponto, tempo, legenda pequena)
- `K.numero(n)` (linha 2837)
- `K.circulo()` (linha 2840): Círculo vermelho de thumbnail em volta de um ponto 3D. em(ponto, diâmetro em px, tempo)
- `K.medida()` (linha 2856): Linha de medida entre dois pontos 3D, com texto ao lado. em(a, b, texto, tempo)
- `K.termometro(min = 0, max = 45)` (linha 2875): Termômetro com a temperatura. em(graus, ponto, tempo)
- `K.cta(html)` (linha 2893): CTA fixo no topo da tela no fim do vídeo (aceita <em> pra destacar em amarelo)
- `K.cartaoFinal(texto = 'SEGUE PRA MAIS')` (linha 2906): Cartão final: logo do canal por cima da cena (a cena mostra os personagens acenando)

## Assinatura do canal: sonda, desconstrução, plaquinha e logo

- `K.sonda()` (linha 2924): Sonda: robozinho azul-marinho com lente amarela e o anel dourado do logo. Mora na mochila e dispara o feixe que "abre" os objetos. em(pos, t, alvo, feixe): alvo = ponto pra onde a lente olha; feixe = largura do feixe (0 = sem)
- `K.desconstrucao(seed = 9)` (linha 2976): Desconstrução (assinatura do canal): as peças saem do lugar e flutuam dentro de dois anéis de órbita dourados, com bolinhas correndo neles e brilhos. d.peca(obj, desloca, giro): desloca é no espaço do pai do obj. d.em(e, t, op): e = 0 montado, 1 aberto; op = { centro, escala, pecas: [e de cada peça] }. A cada quadro guarda a posição que a cena deu à peça e devolve no esconder(), então não acumula deslocamento
- `K.plaquinha(texto = 'SEGUE A\nPÁGINA!')` (linha 3046): Plaquinha de madeira fincada no chão (frente pra +z). A cena posiciona e liga/desliga
- `K.logoFinal()` (linha 3065): Logo do canal no topo (quadrado com borda dourada brilhando), pro final fixo
- `K.mostrarLegenda(tl, t)` (linha 3082): Legenda palavra por palavra; palavra-chave (marcada com *asteriscos* no roteiro) em amarelo

## Sons

- `K.sons()` (linha 3111): A cena registra cada efeito sonoro no instante em que acontece (tempo da cena). Repetir a chamada a cada quadro não duplica. O render junta tudo em K.sons e mixa no ffmpeg. dur: corta o som nesse tamanho (pra loops como água correndo)
- `K.som(nome, em, ganho = 1, dur)` (linha 3113)

## Videogame: falha, rebobina, pausa, play, avança

- `K.REBOBINA()` (linha 3129): Eventos por frase no roteiro (campo "jogo"): falha     congela em preto e branco no fim da frase (congela: fração da frase, padrão 0.85) conserta  ⏪ rebobina até antes da falha (volta: quantas frases antes) e fica em ⏸ enquanto monta (rebobina: duração do ⏪ em segundos, padrão K.REBOBINA). Use pouco: 1 ou 2 por vídeo corrige   conserto sem voltar no tempo: a falha some e a cena corta direto pra montagem (mais fluido) pausa     só ⏸      play  ▶ no começo da frase      avanca  ⏩ o tempo passando
- `K.FOV()` (linha 3130)
- `K.prepararJogo(tl)` (linha 3131)
- `K.estadoJogo(t)` (linha 3166)

## Quadro

- `K.render()` (linha 3214)
- `K.preparar(tl)` (linha 3254)
- `K.quando(palavra, desde = 0)` (linha 3275)
- `K.quadro(t)` (linha 3282): Um quadro completo no tempo real t
- `K.capa(titulo)` (linha 3302): Capa / thumbnail: a cena monta a composição em CENA.capa() e o kit põe a pergunta no topo. Área segura: o TikTok corta a capa em 3:4 pelo centro, então tudo que importa fica entre y 240 e 1680. (*palavra* fica amarela, \n quebra a linha)
- `K.blocos(tl)` (linha 3320): Junta frases seguidas com o mesmo plano em blocos com início e fim
- `K.blocoEm(bl, t)` (linha 3331): p: progresso no bloco (0 a 1). q e tq: progresso e tempo depois do ⏪ (o que a cena usa pra montar a peça)

# Como fazer o vídeo (o método completo)

> Todo vídeo tem um `cena.js` próprio, escrito pela IA pra ele: é isso que deixa o personagem atuando, a câmera
> viva, o ⏪ de videogame e os textos no lugar certo. O exemplo pronto é `videos/exemplo/` (lanterna): abra o
> `video.mp4` pra ver o nível, e use o `cena.js` dele como base.
>
> A cena-modelo `montagem` (só o `roteiro.json`, sem código) continua existindo pra um rascunho rápido, mas sai mais
> simples: personagem parado, câmera fixa e sem ⏪. Use só se o usuário pedir algo bem rápido.

## O que ler antes

| Arquivo | Pra quê |
|---|---|
| `canal/canal.md` e `canal/identidade.md` | Tom, personagem, cores, lugar, plaquinha e o bloco que vai no `roteiro.json` |
| `canal/aprendizados.md` | O gosto da pessoa (vale mais que o padrão deste guia) e as lições técnicas dos vídeos anteriores |
| `metodo/formula-roteiro.md` | A fórmula do roteiro e o checklist |
| `metodo/ritmo-e-visual.md` | Ritmo, cortes e o que mostrar |
| `videos/exemplo/` | **Base de todo vídeo novo**: `roteiro.json` e `cena.js` completos, `capa.png` e `video.mp4` |
| `referencias/kit-indice.md` | Tudo o que o motor sabe fazer (peças prontas, efeitos, personagem, textos), com a linha no `motor/kit.js` |

## Arquivos de cada vídeo

`videos/<tema>/`: `roteiro.md` → (ok do usuário) → `roteiro.json` + `cena.js` → prévias (`testes/`) → render
(`narracao/`, `timeline.json`, `capa.png`, `video.mp4`) → `publicacao.md` (`/publicar`). Todo teste (prévias, trechos,
vídeo com `--voz-teste`) vai pra `testes/`; na pasta do vídeo fica só a entrega e o roteiro.

## 1. `roteiro.md`

- Seguir `metodo/formula-roteiro.md`. **Primeiro vídeo do usuário ou pedido de vídeo curto:** ~60 s, 150 a 200
  palavras, 3 ou 4 ciclos. **Senão:** 400 a 550 palavras, 7 a 10 ciclos (mais de 1 minuto)
- 1ª frase: a pergunta bem curiosa (gancho), que também vai na capa
- Ciclos "Se você..." → "Mas..." → "Então você..." → "Esse é o *X*." Ciência conferida: simplificar pode, inventar não
- Fim: "Por fora, é só [...]." → "Por dentro, é [peça], [peça] e [peça]." → a chamada de `canal/canal.md`
- **Ideias de cena, frase por frase:** onde estamos, o que a câmera mostra, **o que o personagem faz**, que peça
  entra, que texto aparece. Frase sem nada pra mostrar é frase fraca
- Mostrar com as perguntas do `/novo-video` e **esperar o ok** (a não ser que o usuário tenha pedido pra seguir direto)

## 2. `roteiro.json`

Copiar o topo de `videos/exemplo/roteiro.json` e trocar título e capa. `estilo`, `fps` e `efeitos` vêm do bloco de
`canal/identidade.md`; a `voz`, como manda o `/novo-video` (ElevenLabs se tiver `.env`, senão `{"motor": "teste"}`).
**Sem `modelo` e sem `objeto`**: quem desenha tudo é o `cena.js`.

Cada frase: `{ "texto", "plano", "jogo"?, "rebobina"?, "gancho"? }`
- `plano`: **nome livre** do momento que o `cena.js` desenha (`"tropeca"`, `"pilha"`, `"pilha_rotulo"`...). Frases
  seguidas com o mesmo plano viram um bloco só. Na prática, **um plano por frase**, pra cortar a câmera a cada frase
- 1ª frase: `"plano": "gancho", "gancho": true`. A cauda do vídeo: `"cauda": {"segundos": 1.6, "plano": "cartao"}`
- `"Esse é o *X*."`: o `*X*` fica amarelo na legenda; plano próprio (`"x_rotulo"`) com o nome grande da peça
- **`jogo`, o ritmo de videogame:**
  - `"falha"` na frase do problema: no fim da frase a cena congela em preto e branco
  - `"corrige"` na frase da solução: a falha some e corta direto pra montagem. **É o padrão**
  - `"conserta"` (com `"rebobina": 0.6`): ⏪ volta no tempo até antes da falha. **No máximo 2 por vídeo**
  - `"pausa"` ⏸, `"play"` ▶, `"avanca"` ⏩ (o tempo passando)

## 3. `cena.js`

Começar copiando `videos/exemplo/cena.js` e trocar o conteúdo. O esqueleto:

```js
(function () {
  let tl, bl, menino;
  const I = {}, fx = {};

  function montar(timeline) {
    tl = timeline;
    bl = K.blocos(tl);
    bl.forEach((b, i) => { if (I[b.plano] == null) I[b.plano] = i; });
    // Cria TUDO uma vez só: cenário (K.mundo, K.casa...), o objeto peça por peça, personagem, luzes, efeitos e textos
    menino = K.boneco({ /* do canal/identidade.md */ });
    fx.rot = { pilha: K.rotulo('Pilha') };                 // um por peça nomeada
    fx.et = { escuro: K.etiqueta('Escuro total', 'vermelho') };   // um por ideia
  }

  const P = {
    gancho(B, S, tc) { /* o objeto pronto, a capa ganhando movimento */ },
    tropeca(B, S, tc) { /* câmera, personagem, peças e textos desta frase */ },
    // ... uma função por plano do roteiro.json
    capa(B, S, tc) { /* composição da capa */ },
    cartao(B, S, tc) { /* a cauda */ },
  };

  function cena(tc, t, plano) {
    const B = plano ? { plano, p: 0.5, t: 1, dur: 2, inicio: 0, ate: 2, q: 0.5, tq: 1, bloco: { reb: 0 } } : K.blocoEm(bl, tc);
    const bi = plano ? -1 : bl.indexOf(B.bloco);
    const ja = (n) => I[n] != null && bi > I[n];          // a peça já foi montada?
    const S = { /* estado padrão do quadro, a partir de ja(...) */ };
    P[B.plano](B, S, tc);
    aplicar(S, tc);                                         // posiciona tudo a partir de S
  }

  window.CENA = { montar, cena, capa: () => cena(0, 0, 'capa') };
})();
```

### As regras que fazem o vídeo prender

1. **Tudo é função do tempo da cena (`tc`).** Nada de guardar estado de um quadro pro outro: o ⏪, as prévias e o
   `--trecho` pulam pra qualquer instante. Use `B.p` (0 a 1 no bloco), `B.t` (segundos no bloco), `B.q`/`B.tq`
   (progresso e tempo depois do ⏪, pra montar a peça), `K.faixa`, `K.suave`, `K.queda`, `K.quando('palavra')`
2. **Câmera viva: um plano de câmera por frase**, sempre com movimento leve (`K.plano(de, ate, p)`). Em 9:16 a câmera
   enxerga pouco de lado (a largura do quadro é ~metade da distância): plano aberto fica longe ou olha ao longo da
   cena, como o facho da lanterna. Vídeo com a mesma câmera do começo ao fim é o que não pode
3. **O personagem atua em toda frase.** `reset(t)` no começo do plano e uma ação: `andar`, `correr`, `pular`, `cair`,
   `apontar`, `pensar`, `segurar`, `comemorar`, `acenar`, `suar`, `humor('assustado')`. Ele **faz o que a frase diz**
   ("tropeça no degrau": ele tropeçando). Cuidado pra ele não ficar colado na câmera nem na frente da peça
4. **Peça nova entra com movimento** (cai e quica com `K.queda`, desliza, encaixa), com som, e brilha com `K.destaque`
5. **Textos da tela, um de cada vez:**
   - **Rótulo** (`K.rotulo`, amarelo e grande) só no plano do "Esse é o *X*", perto da peça
   - **Etiqueta** (`K.etiqueta`): vermelho = problema, verde = funciona, azul = informação, laranja = curiosidade.
     No máximo 2 na tela
   - **Marca** ✗/✓ (`K.marca`) ao lado da etiqueta, nunca em cima de outro texto; **contador** (`K.contador`) sozinho
   - No "Por dentro", os nomes das peças entram **em sequência**, acompanhando a fala
   - A legenda fica em y ~1180: nada importante embaixo dela
6. **Final:** `por_fora` (o objeto inteiro), `por_dentro` (as peças se separam no ar, uma por vez, como no exemplo),
   `segue` (a plaquinha de `canal/identidade.md` com `K.plaquinha`, e o logo com `K.logoFinal` se existir
   `canal/logo.png`) e `cartao` na cauda
7. **Capa (`P.capa`):** a pergunta vai no topo sozinha (o motor põe); o objeto no meio, mostrando o detalhe mais
   curioso com `K.circulo`; o personagem perto, sem tampar o detalhe. Tudo entre y 240 e 1680 (o TikTok corta em 3:4)
8. **Sons:** `K.som(nome, instante)` com os nomes de `motor/sons/`

## 4. Prévias

```
node motor/render.js videos/<tema> --voz-teste --previa 1,6,12,...    (um tempo no meio de cada frase)
node motor/render.js videos/<tema> --voz-teste --capa
node motor/render.js videos/<tema> --voz-teste --trecho 20,35          (movimento e ⏪ com som)
```

Os tempos de cada frase ficam em `videos/<tema>/timeline.json` depois da 1ª rodada. **Abrir as imagens** e conferir,
frase por frase: o personagem está fazendo a ação e aparece inteiro? A câmera mudou? A peça certa apareceu? Algum
texto encavalado ou cortado? A capa está no nível da `videos/exemplo/capa.png`? Ajustar e repetir.

## 5. Render e entrega

`node motor/render.js videos/<tema>` e a **entrega completa** do `/novo-video` (capa conferida, `/publicar`, pauta
marcada, testes guardados em `testes/`), sem esperar pedido.

## Checklist antes do render final

- [ ] `cena.js` próprio (nada de `"modelo": "montagem"`)
- [ ] O personagem faz uma ação em toda frase e aparece inteiro no quadro
- [ ] A câmera muda a cada frase
- [ ] Tem `jogo`: as falhas consertadas com `corrige`, e no máximo 2 `conserta` (⏪)
- [ ] Nenhum texto em cima de outro
- [ ] O objeto parece o que é, e cada peça nova aparece de perto quando é nomeada

# Referência do roteiro.json (cena-modelo "montagem")

Exemplo completo e funcionando: `videos/exemplo/roteiro.json` (lanterna).

## Topo

| Campo | O quê |
|---|---|
| `titulo` | Nome curto do vídeo |
| `capa` | Pergunta da capa, 2 a 4 linhas. `*palavra*` fica amarela, `\n` quebra a linha. Ex: `"COMO FUNCIONA\nUMA *LANTERNA*?"` |
| `modelo` | `"montagem"` |
| `voz` | `{"motor": "teste"}` ou `{"motor": "elevenlabs", "id": "...", "velocidade": 1.1, "acelerar": "auto"}` |
| `alvoPpm` | `190` (palavras por minuto) |
| `lugar` | `quintal` · `praia` · `cozinha` · `espaco` · `lua` · `escuro` |
| `hora` | `dia` · `tarde` · `noite` |
| `casa` | `true` põe uma casinha no fundo do quintal |
| `personagem` | `{"tipo": "menino"/"menina", "roupa": "camiseta"/"moletom", "cores": {...}, "capacete": "obra"/"espaco"}` |
| `objeto` | ver abaixo |
| `frases` | ver abaixo |
| `cauda` | `{"segundos": 1.6, "plano": "cartao"}`: o personagem acena no fim |
| `trilha` | `{"arquivo": "trilha", "ganho": 0.22}` |
| `efeitos` | `{"ganho": 0.855}` (volume dos efeitos sonoros). `{"abaixa": true}`: efeitos por baixo da voz, sem estourar |
| `estilo` | `"redondo"`: liso, quinas arredondadas, cenário vivo, sombra macia, personagem mais realista. Sem o campo: low-poly |
| `fps` | `60` deixa o movimento mais fluido (padrão 30; o render leva o dobro do tempo) |

## objeto

```json
"objeto": {
  "destaque": 2,
  "plaquinha": "SEGUE O\nCANAL!",
  "pecas": [ {...}, {...} ]
}
```

- `destaque`: número da peça (contando do 0) que ganha o círculo vermelho na capa
- `plaquinha`: texto da placa de madeira do final
- Opcionais: `"assinatura": "aneis"` (anéis dourados girando na vista explodida) e `"ajudante": "sonda"` (robozinho com feixe)

### Peça

```json
{"nome": "refletor", "forma": "funil", "tam": [0.55, 0.2, 0.45], "cor": "#d8dde3", "metal": true, "pos": [0, 1.42, 0]}
```

| Campo | O quê |
|---|---|
| `nome` | Aparece na vista explodida. Use a palavra que a narração fala |
| `forma` | ver tabela |
| `tam` | tamanho, depende da forma |
| `pos` | `[x, y, z]` do **centro** da peça. y é a altura (o chão é 0). Para peças que ficam em pé no chão, y = metade da altura |
| `giro` | `[x, y, z]` em graus. Ex: `[0, 0, 90]` deita um cilindro |
| `cor` | `"#rrggbb"` |
| `brilho` | `true` ou de 0 a 1: a peça acende (lâmpada, LED, brasa) |
| `transparente` | de 0 a 1: deixa ver o que tem dentro (vidro, tubo, tanque) |
| `metal` | `true`: cara de metal |
| `fixa` | `true`: peça de cenário ou base (fogão, mesa, chão) que não se solta na vista explodida |
| `som` | som da peça encaixando: `metal`, `tampa`, `baque`, `madeira`, `pedra` (padrão escolhido pelo tamanho) |

| Forma | `tam` | Bom pra |
|---|---|---|
| `caixa` | `[largura, altura, profundidade]` | botão, motor, gaveta, parede, tampa quadrada |
| `cilindro` | `[raio, altura]` ou `[raioCima, raioBaixo, altura]` | pilha, tanque, eixo, coluna, roda (com `giro`) |
| `tubo` | `[raio, altura]` (oco, sem tampa) | corpo transparente, cano largo, chaminé |
| `funil` | `[raioCima, raioBaixo, altura]` (oco) | refletor, bocal, alto-falante, abajur |
| `esfera` | `[raio]` | lâmpada, bola, boia, cabeça |
| `cone` | `[raio, altura]` | ponta, telhado, bico |
| `anel` | `[raio, grossura]` (deitado) | borracha de vedação, aro, junta |
| `cano` | `pontos: [[x,y,z], ...]`, `tam: [raio]` | fio, mangueira, cano com curvas |
| `placa` | `texto`, `tam: [largura, altura]` | etiqueta, mostrador, tela |
| `kit` | `kit: "<nome>"` | peças prontas, ver abaixo |

Kits: `casa`, `arvore`, `pinheiro`, `carro`, `tambor`, `balde`, `regador`, `flor`, `computador`, `celular`, `bicicleta`,
`satelite`, `navio`, `foguete`, `moduloLunar`, `capsula`, `terra`, `lua` (com `tam: [raio]`), `balao`, `torneira`,
`registro`, `predio` (com `tam: [andares, largura, profundidade]`), `peixe`.

**Dica:** monte de baixo pra cima, conferindo que a base de uma peça encosta no topo da outra
(base = y − altura/2, topo = y + altura/2). Peça que nunca aparece num `monta` fica no objeto desde o começo.

## frases

```json
{"texto": "Então você encaixa uma pilha, que empurra a eletricidade pelo fio.", "plano": "monta", "peca": 2, "etiqueta": "Acendeu"}
```

| Plano | Quando usar | Campos úteis |
|---|---|---|
| `gancho` | 1ª frase (com `"gancho": true`) | |
| `problema` | "Se você..." e todo "Mas..." | `etiqueta` (vermelha), `acao`, `humor`, `contador` |
| `monta` | "Então você..." | `peca` (número ou lista), `etiqueta` (verde), `marca: "certo"`, `efeito` |
| `nome` | "Esse é o / Essa é a..." | `peca`; o rótulo usa o `*termo*` da frase |
| `mostra` | o objeto funcionando, "é por isso que", número | `etiqueta`, `contador`, `efeito`, `marca` |
| `por_fora` | "Por fora, é só..." | |
| `por_dentro` | "Por dentro, é..." (vista explodida com o nome de cada peça) | |
| `segue` | a chamada final com a assinatura | |

Opcionais em qualquer frase:
- `etiqueta`: texto curto da pílula (até ~25 letras); `cor`: `verde`, `vermelho`, `azul`, `laranja`, `amarelo`, `roxo`
- `acao` do personagem: `cair`, `suar`, `pensar`, `pular`, `comemorar`, `apontar`, `acenar`
- `humor`: `feliz`, `triste`, `surpreso`, `bravo`, `assustado`
- `contador`: `{"texto": "3 HORAS", "sub": "COM UMA PILHA"}` (cartão branco com número)
- `efeito`: `{"tipo": "luz", "peca": 1, "forca": 1, "mantem": true}`. Tipos: `luz` (feixe pra cima), `brilho`, `fogo`,
  `fumaca`, `vapor`, `agua` (escorre da peça), `chuva`, `vento`, `festa`. `mantem: true` deixa ligado nas frases seguintes.
  `escala` muda o tamanho do fogo, da fumaça e do vapor (ex: `0.3` pra uma boca de fogão); `altura` muda até onde o vapor sobe
- `apaga`: `"luz"` (ou outro tipo, ou `"tudo"`) desliga um efeito que estava mantido

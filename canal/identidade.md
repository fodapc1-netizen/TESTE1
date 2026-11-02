# Identidade visual do canal

> É isso que faz o seu vídeo não parecer com o de ninguém. O `/instalar` preenche com você.
> O `/novo-video` copia o bloco "No roteiro.json" pra todo vídeo novo.

## Personagem

Personagem inventor: menino de camiseta amarela, bermuda azul e capacete de obra. Combinação adotada como padrão após resposta afirmativa sem escolha entre as duas opções; pode ser alterada pelo usuário.

- Tipo: `menino` ou `menina`
- Roupa: `camiseta` (camiseta + bermuda) ou `moletom` (moletom com capuz, mochila, calça)
- Cores que dá pra trocar: `camiseta`, `bermuda`, `tenis`, `cabelo`, `pele`, `moletom`, `punho`, `calca`, `mochila`, `vestido`
- Acessório opcional: `capacete` = `obra` ou `espaco`

## Lugar e hora padrão

Cidade de dia como cenário padrão, mudando de cenário e horário quando o assunto pedir. A cidade deve preencher a tela inteira e continuar até o horizonte, sem bordas de mapa, base ou aparência de maquete; câmera dentro do ambiente, conforme teste aprovado pelo usuário. Cenas com mais detalhes e movimento: prédios, ruas, árvores e carros quando pertinentes; personagem atuando e câmera acompanhando a explicação. A cidade será montada no cena.js de cada vídeo com os componentes do motor, pois não existe um cenário pronto chamado cidade.

Lugares: `quintal`, `praia`, `cozinha`, `espaco`, `lua`, `escuro` (mundo de dentro: átomos, células). Horas: `dia`, `tarde`, `noite`.

## Estilo

[Ex: redondo e mais realista. Sem o campo, sai o low-poly (facetado, mais simples).]

- `"estilo": "redondo"`: sombreamento liso, quinas arredondadas, cenário vivo (flores, arbustos, borboletas, pássaros,
  pólen, vento), sombra macia, personagem com olho de verdade
- `"fps": 60`: movimento mais fluido (o render leva o dobro do tempo)
- `"efeitos": {"abaixa": true}`: os efeitos sonoros ficam por baixo da voz, sem estourar

## Voz

Narração com voz masculina, em português do Brasil, em tom animado e curioso, com fala clara. Voz escolhida: André — Natural excitement (ElevenLabs), opção 2 aprovada após ouvir a amostra. Manter os ajustes da amostra aprovada.

## Plaquinha do final

[Ex: SEGUE O\nCANAL!]  (o `\n` quebra a linha)

## Logo

Logo enviado pelo usuário na conversa: inventor com capacete amarelo, óculos e camisa azul, com lâmpada e engrenagens sobre fundo azul e moldura circular roxa. Usar a imagem original como logo do canal; não alterar o personagem dos vídeos automaticamente para coincidir com o logo. Imagem original instalada em `canal/logo.png`, extraída de `logo_perfil_2.zip`. O motor carrega esse arquivo automaticamente para o final dos vídeos.

## No roteiro.json

O valor técnico `quintal` abaixo serve como base para a cena urbana personalizada. Montar a cidade no `cena.js`; não usar `cidade` como valor de cenário sem suporte no motor.

```json
"estilo": "redondo",
"fps": 60,
"efeitos": {"abaixa": true},
"voz": {"motor": "elevenlabs", "id": "iJ7HFMLySFb7M2U4KGy5", "modelo": "eleven_multilingual_v2", "estabilidade": 0.4, "similaridade": 0.8, "estilo": 0.3, "velocidade": 1.1},
"personagem": {"tipo": "menino", "roupa": "camiseta", "capacete": "obra", "cores": {"camiseta": "#f2c94c", "bermuda": "#2a4a92", "tenis": "#f4f1ea", "cabelo": "#7a4a22"}},
"lugar": "quintal",
"hora": "dia"
```

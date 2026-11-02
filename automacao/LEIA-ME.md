# Vídeos diários do Mundo 3D

Rotina preparada para GitHub Actions, independente do computador pessoal. O agendamento fica desligado até configurar `AUTOMACAO_ATIVA=true`. Nenhuma rede social está conectada.

## Ativar

1. Em TESTE1, abra Settings → Secrets and variables → Actions → New repository secret. Cadastre `ELEVENLABS_API_KEY` e `OPENAI_API_KEY`, cada uma com a chave correspondente no campo Value. As chaves deste chat não são transferidas para o GitHub. Nunca coloque chaves no código ou nas mensagens.
2. Cadastre limites de gastos nas contas dos serviços antes do teste. O ElevenLabs usa a voz André já escolhida; a OpenAI gera roteiro e cenas. A assinatura do ChatGPT não inclui créditos da API. O GitHub Actions está sujeito aos limites e cobrança da sua conta.
3. Em Actions → Vídeo diário para revisão → Run workflow, execute um teste manual. Confira o vídeo, os fatos e as cenas. A integração com as APIs externas ainda precisa desse teste com as chaves do GitHub.
4. Depois do teste, em Settings → Secrets and variables → Actions → Variables, crie `AUTOMACAO_ATIVA` com valor `true`. Opcional: `OPENAI_MODEL`, padrão `gpt-5`.

Horário pretendido: diariamente às 08h de Brasília (11h UTC). O GitHub pode atrasar ou pular execuções em períodos de carga; não é horário garantido. Agendamentos em repositórios públicos podem ser desativados após 60 dias sem atividade.

## Receber os vídeos

Abra Actions → execução concluída → Artifacts → Mundo3D-[tema]. Baixe o ZIP e extraia o MP4. É necessário entrar no GitHub; os arquivos ficam disponíveis por 30 dias. Cada entrega inclui capa, legenda, roteiro, cena e aviso de revisão. Baixe antes de vencer o prazo.

## Funcionamento e limites

- Um tema da fila por execução; sete temas iniciais, escolhidos com autorização do usuário. Quando acabarem, a rotina não gera novos temas sozinha: adicione itens em `automacao/fila.json`.
- Roteiros e cenas novos são criados por IA. Não se promete a mesma qualidade das cenas revisadas manualmente nesta conversa. Confira os primeiros resultados e pause se houver erros.
- Aproximadamente 230–290 palavras por roteiro; limite técnico de 320 palavras e 4500 caracteres, sem tentativas automáticas ilimitadas. O custo efetivo depende do modelo, dos planos e de falhas/reexecuções. O limite de tokens por chamada não substitui um limite financeiro na conta.
- Falta de chave ou falha de geração interrompe o processo. Não troca por voz de teste. Materiais e narração são guardados em cache para tentar reutilizar, mas o GitHub pode remover caches.
- Confere sintaxe, presença de áudio, duração, resolução e decodificação do MP4. Isso não verifica automaticamente a verdade de todos os fatos, a qualidade artística ou todas as colisões dos modelos.
- Só registra concluído após salvar a entrega. Falhas entre envio do artifact e registro podem exigir intervenção e repetir produção. Não apague concluídos para evitar repetição.
- O workflow precisa permissão de escrita em Contents para registrar concluídos. Regras de proteção de main podem impedir esse registro; confira antes de ativar o diário.

Para pausar, mude `AUTOMACAO_ATIVA` para `false` ou desative o workflow na aba Actions. Uma execução manual continua possível com a variável desligada; para interromper execução já iniciada, use Cancel workflow.

## Verificação local

`node --test automacao/diario.test.cjs` valida seleção, prevenção de repetição e restrições básicas. `node automacao/diario.cjs check` apenas mostra o próximo tema, sem API ou gasto. O teste completo em GitHub com as novas chaves ainda é necessário.

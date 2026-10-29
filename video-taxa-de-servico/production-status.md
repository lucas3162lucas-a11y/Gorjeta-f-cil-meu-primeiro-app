# Status de produção: "Pra onde vão os 10% da sua conta?"

**Fase atual:** Fase 1 concluída. **AGUARDANDO APROVAÇÃO.** A implementação e a renderização ainda não
começaram.

| Item | Valor |
| --- | --- |
| Versão do roteiro | v1 (29/10/2026) |
| Skill | `remotion-problem-resolve-video`, enviada pelo usuário em .zip |
| Tema | Taxa de serviço (10%) em restaurantes no Brasil, escolhido pelo usuário ("Pode fazer" em resposta às sugestões) |
| Formato | 90 s, 1080 × 1920, 30 fps, 2700 frames, pt-BR |
| TTS planejado | edge-tts (gratuito), `pt-BR-AntonioNeural`, +5%. Voz paga só com autorização |
| Roteiro | `video-taxa-de-servico/roteiro.md` |
| Scene plan | `video-taxa-de-servico/scene-plan.ts` (12 cenas) |

## Verificações já feitas na Fase 1

- `scene-plan.ts` compilou com `tsc --strict` junto com `utils/animation.ts` e `utils/timing.ts` do
  template, configurados como no cabeçalho do arquivo (o pacote `remotion` foi substituído por um stub).
- A verificação de integridade passou: 12 cenas contíguas, começando no frame 0 e somando 2700 frames.
  Todos os badges ficam dentro das suas cenas.
- Nenhum áudio, imagem ou vídeo foi gerado. Todos os `audioCues` estão como `planned`.

## Pendências

- [ ] Aprovação do usuário para a v1, ou pedido de ajustes.
- [ ] Recomendado: revisão jurídica das cenas 6, 8 e 10 (situação atual dos §§ do art. 457 da CLT após
      a Lei 13.467/2017 e a caducidade da MP 808/2017).
- [ ] Fase 2: criar o projeto Remotion, gerar a narração, montar o diorama, renderizar e verificar.

## Registro de aprovação

_(vazio: nenhuma aprovação recebida até agora)_

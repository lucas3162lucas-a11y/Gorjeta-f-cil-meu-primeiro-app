# Status de produção: "Como a geladeira gela?"

**Fase atual:** Fase 1 concluída. **AGUARDANDO APROVAÇÃO.** A implementação e a renderização ainda não
começaram.

| Item | Valor |
| --- | --- |
| Versão do roteiro | v1 (30/10/2026) |
| Pedido | "Faça outro vídeo assim", sobre algo que não envolva dinheiro e sem a tremedeira do vídeo anterior |
| Tema | Ciclo de refrigeração da geladeira doméstica (escolhido pelo agente) |
| Personagem | Garçom do canal "Explica Aí" (o mesmo modelo do vídeo anterior e da foto de perfil) |
| Formato | 90 s, 1080 × 1920, 30 fps, 2700 frames, pt-BR |
| Voz planejada | Piper `pt_BR-faber-medium` (a mesma do canal), gratuita |
| Roteiro | `video-geladeira/roteiro.md` |
| Scene plan | `video-geladeira/scene-plan.ts` (12 cenas) |

## Verificações já feitas na Fase 1

- `scene-plan.ts` compila em modo estrito com os utilitários do template.
- Timeline íntegra: 12 cenas contíguas somando 2700 frames; badges dentro das cenas; chaves de câmera
  em ordem.
- Causa da tremedeira do vídeo anterior identificada: a trilha `camera.shake` começava em 1 antes da
  cena 6. Já foi corrigida no projeto `video-taxa-de-servico`, e este roteiro não usa tranco de câmera.

## Pendências

- [ ] Aprovação do usuário para a v1, ou pedido de ajustes.
- [ ] Fase 2: implementar, gerar a narração, renderizar e **medir** a estabilidade no MP4.

## Registro de aprovação

_(vazio)_

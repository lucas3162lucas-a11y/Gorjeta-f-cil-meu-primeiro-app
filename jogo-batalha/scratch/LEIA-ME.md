# A Noite dos Objetos — versão Scratch

O arquivo pronto é `../A-Noite-dos-Objetos.sb3`.

**Para jogar ou editar:** abra https://scratch.mit.edu/projects/editor, clique em
*Arquivo → Carregar do seu computador* e escolha o `.sb3`. Depois clique na bandeira verde.

Controles: setas para mover, Z (ou espaço/Enter) para confirmar, X para voltar.
Também dá para jogar com o mouse: clique nos botões e segure o clique dentro da caixa para guiar a alma.

## Como o projeto está organizado

| Ator | O que faz |
|---|---|
| **Jogo** | Toda a lógica (turnos, menus, ações, itens, LV) e o desenho da tela com a caneta. As letras são fantasias de pixel que ele carimba. |
| **Monstro** | Desenho do monstro, balão de fala e animações (tremer ao apanhar, sumir ao morrer). |
| **Bala** | Os 11 ataques. O ator original cria clones; cada clone é um projétil. |
| **Alma** | O coração que você move durante o desvio (inclui o modo de pulo). |

Para mudar textos, ações ou ataques sem mexer bloco por bloco, edite `gerar_sb3.py`
e rode `python3 gerar_sb3.py` para gerar o `.sb3` de novo.

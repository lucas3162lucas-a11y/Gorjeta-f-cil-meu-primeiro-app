// O nicho do canal e os formatos que viralizaram nele (pesquisa de outliers em docs/modelagem-viral.md).
// Para mudar de nicho, edite este arquivo.
module.exports = {
  nome: 'Curiosidades de animais e da natureza',
  selo: 'VOCÊ SABIA?',
  temas: [
    'animais do Brasil', 'animais marinhos', 'insetos', 'aves', 'répteis', 'mamíferos estranhos',
    'animais perigosos', 'animais da Amazônia', 'animais do mundo todo', 'plantas e natureza',
  ],
  // Cada formato copia o MECANISMO de um Short que viralizou (gancho + estrutura + chamada final).
  formatos: [
    {
      nome: 'proibicao',
      gancho: 'Uma ordem negativa sobre um animal específico: "Jamais faça X" ou "Por que você nunca deve X".',
      estrutura: 'Gancho com a proibição → o que parece normal ou inofensivo → a virada que explica o perigo → fecho curto.',
      chamada: 'Uma brincadeira de engajamento ligada ao animal, ex.: "Seus likes viram girafas."',
    },
    {
      nome: 'segredo',
      gancho: '"O segredo escondido no/na <parte do corpo> do <animal>."',
      estrutura: 'Gancho → o que todo mundo vê → o detalhe escondido → para que ele serve → fecho surpreendente.',
      chamada: '"Segue pra mais segredos da natureza."',
    },
    {
      nome: 'versus',
      gancho: '"Animais do Brasil versus animais de <outro país>."',
      estrutura: '5 duelos no padrão "O Brasil tem X, mas <país> tem Y", do menos ao mais impressionante.',
      chamada: 'Pergunta que gera comentários: "Qual país vence? Comenta aí."',
    },
    {
      nome: 'parece_inofensivo',
      gancho: '"Parece <fofo/inofensivo>, mas…" sobre um animal específico.',
      estrutura: 'Gancho → por que ele parece inofensivo → o detalhe perigoso ou bizarro → fecho com ironia leve.',
      chamada: '"Você teria coragem de chegar perto? Comenta."',
    },
  ],
  hashtags: ['#curiosidades', '#vocesabia', '#animais', '#fatoscuriosos', '#fyp'],
  // Cores do fundo animado (usado quando não há vídeo de fundo do Pexels)
  cores: ['0x0f2027', '0x203a43', '0x2c5364', '0x11998e'],
};

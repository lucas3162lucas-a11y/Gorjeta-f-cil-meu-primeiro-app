// Os 3 planos vendidos. Somente mensal (não existe plano anual).
// Preços em reais. Para mudar o que cada plano tem, edite aqui.
const PLANS = {
  simple: {
    id: 'simple',
    name: 'Simple',
    price: 15.25,
    recommended: false,
    monthlyReplies: 300,
    memory: 6, // quantas mensagens anteriores a IA lembra em cada conversa
    catalog: false, // lista de produtos/preços
    businessHours: false, // horário de atendimento + mensagem fora do horário
    humanTakeover: false, // IA pausa quando você responde pelo celular
    handoffKeyword: false, // cliente pede "atendente" e você é avisado
    history: false, // ver conversas no painel
    features: [
      'IA respondendo seus clientes 24h',
      '1 número de WhatsApp',
      '300 respostas da IA por mês',
      'Informações do seu negócio e FAQ',
      'Memória curta da conversa',
    ],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 29.9,
    recommended: true,
    monthlyReplies: 1500,
    memory: 12,
    catalog: true,
    businessHours: true,
    humanTakeover: true,
    handoffKeyword: false,
    history: false,
    features: [
      'Tudo do Simple',
      '1.500 respostas da IA por mês',
      'IA mais inteligente (NVIDIA Nemotron Super)',
      'Catálogo de produtos e preços',
      'Horário de atendimento',
      'IA pausa quando você assume a conversa',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 47.9,
    recommended: false,
    monthlyReplies: 5000,
    memory: 30,
    catalog: true,
    businessHours: true,
    humanTakeover: true,
    handoffKeyword: true,
    history: true,
    features: [
      'Tudo do Plus',
      '5.000 respostas da IA por mês',
      'IA mais poderosa (NVIDIA Nemotron Ultra)',
      'Memória longa da conversa',
      'Transferência para atendente com aviso no seu WhatsApp',
      'Histórico de conversas no painel',
    ],
  },
};

const formatPrice = (value) => value.toFixed(2).replace('.', ',');

module.exports = { PLANS, formatPrice };

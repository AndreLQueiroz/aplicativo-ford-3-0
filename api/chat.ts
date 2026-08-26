import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

// ================================
// GROQ
// ================================

const groqApiKey = process.env.GROQ_API_KEY;

const client = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null;


// ================================
// BASE DE CONHECIMENTO FORD
// ================================

const fordKnowledgeBase = {
  ranger: {
    nome: 'Ford Ranger 26MY',
    motor: '3.0 V6 Diesel Turbo',
    potencia: '250 cv',
    torque: '600 Nm',
    cambio: 'Automático de 10 marchas',
    consumoMedio: '9,55 km/L',

    tecnologias: [
      'AEB',
      'TPMS nas versões Limited e Limited+',
      'FordPass Connect',
      'Câmera 360° em versões superiores',
      'Piloto adaptativo Stop & Go na Limited+',
      'Terrain Management System',
      'Tração integral',
    ],
  },

  territory: {
    nome: 'Ford Territory',
    categoria: 'SUV médio',
    foco: 'conforto, tecnologia, conectividade e uso urbano/familiar',

    tecnologias: [
      'central multimídia',
      'assistências ao condutor',
      'conectividade',
      'recursos de conforto',
    ],
  },

  maverick: {
    nome: 'Ford Maverick',
    categoria: 'picape urbana',
    foco: 'uso misto, cidade, estrada e versatilidade',

    tecnologias: [
      'caçamba funcional',
      'assistências ao condutor',
      'boa proposta de uso urbano',
    ],
  },

  broncoSport: {
    nome: 'Ford Bronco Sport',
    categoria: 'SUV aventureiro',
    foco: 'off-road leve, aventura e tecnologia embarcada',

    tecnologias: [
      'modos de condução',
      'tração inteligente',
      'recursos off-road',
    ],
  },

  f150: {
    nome: 'Ford F-150',
    categoria: 'picape grande',
    foco: 'força, carga, reboque e desempenho',

    tecnologias: [
      'motor de alta performance',
      'capacidade de reboque',
      'tecnologias de assistência',
    ],
  },

  transit: {
    nome: 'Ford Transit',
    categoria: 'veículo comercial',
    foco: 'transporte, carga, operação profissional e frota',

    tecnologias: [
      'controle operacional',
      'conectividade',
      'uso comercial',
    ],
  },

  ecosport: {
    nome: 'Ford EcoSport',
    categoria: 'SUV compacto',
    foco: 'uso urbano, praticidade e manutenção acessível',

    tecnologias: [
      'posição elevada de dirigir',
      'multimídia em versões equipadas',
      'boa proposta urbana',
    ],
  },

  ka: {
    nome: 'Ford Ka',
    categoria: 'hatch/sedan compacto',
    foco: 'economia, cidade e manutenção simples',

    tecnologias: [
      'baixo custo de uso',
      'praticidade urbana',
      'consumo eficiente',
    ],
  },
};


// ================================
// DETECTAR MODELO
// ================================

function detectFordModel(model?: string) {
  const text = model?.toLowerCase() || '';

  if (text.includes('ranger')) {
    return fordKnowledgeBase.ranger;
  }

  if (text.includes('territory')) {
    return fordKnowledgeBase.territory;
  }

  if (text.includes('maverick')) {
    return fordKnowledgeBase.maverick;
  }

  if (text.includes('bronco')) {
    return fordKnowledgeBase.broncoSport;
  }

  if (text.includes('f-150') || text.includes('f150')) {
    return fordKnowledgeBase.f150;
  }

  if (text.includes('transit')) {
    return fordKnowledgeBase.transit;
  }

  if (text.includes('ecosport')) {
    return fordKnowledgeBase.ecosport;
  }

  if (text.includes('ka')) {
    return fordKnowledgeBase.ka;
  }

  return null;
}


// ================================
// API VERCEL
// ================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido',
    });
  }


  // Verifica chave da Groq
  if (!client) {
    console.error('GROQ_API_KEY não configurada.');

    return res.status(500).json({
      error: 'GROQ_API_KEY não está configurada no servidor.',
    });
  }


  try {

    const { message, vehicle, fuelHistory } = req.body as {
      message?: string;

      vehicle?: {
        model?: string;
        [key: string]: unknown;
      };

      fuelHistory?: unknown;
    };


    // ================================
    // VALIDAR MENSAGEM
    // ================================

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Mensagem inválida.',
      });
    }


    // ================================
    // DETECTAR CARRO
    // ================================

    const detectedModel = detectFordModel(vehicle?.model);


    // ================================
    // PROMPT DO AUTOPULSE
    // ================================

    const systemPrompt = `
Você é o AutoPulse AI, um copiloto automotivo inteligente.

Seu objetivo é ajudar usuários com informações sobre veículos Ford,
manutenção, consumo, custos, viagens e tecnologias automotivas.

Responda sempre em português do Brasil.

Use linguagem:
- moderna
- natural
- objetiva
- clara
- fácil de entender

Você pode ajudar com:

- especificações técnicas
- tecnologias Ford
- manutenção
- consumo
- custos
- viagens
- modos de condução
- dúvidas gerais sobre carros
- interpretação do histórico de abastecimento
- recomendações baseadas nos dados cadastrados


REGRAS IMPORTANTES:

1. Se o usuário perguntar sobre Ford Ranger,
utilize prioritariamente os dados técnicos existentes na base.

2. Para outros veículos Ford,
utilize as informações disponíveis na base geral.

3. Nunca invente potência, torque, consumo,
equipamentos ou especificações como se fossem dados oficiais.

4. Quando uma informação exata não estiver disponível,
diga claramente:

"Não tenho esse dado oficial na base do app."

Depois disso, você pode fornecer uma orientação geral,
deixando claro que se trata de uma estimativa ou explicação geral.

5. Sempre que possível, utilize os dados cadastrados
pelo próprio usuário para personalizar a resposta.

6. Quando houver histórico de abastecimento,
analise esses dados quando forem relevantes para a pergunta.

7. Não diga que possui acesso em tempo real aos sistemas da Ford.

8. Não diga que consultou dados externos se eles não foram
fornecidos no contexto.


==============================
BASE GERAL FORD
==============================

${JSON.stringify(fordKnowledgeBase, null, 2)}


==============================
MODELO DETECTADO
==============================

${JSON.stringify(detectedModel, null, 2)}


==============================
DADOS DO VEÍCULO DO USUÁRIO
==============================

${JSON.stringify(vehicle ?? null, null, 2)}


==============================
HISTÓRICO DE ABASTECIMENTO
==============================

${JSON.stringify(fuelHistory ?? [], null, 2)}
`;


    // ================================
    // CHAMADA PARA GROQ
    // ================================

    const completion = await client.chat.completions.create({

      // Modelo disponível na Groq
      model: 'openai/gpt-oss-20b',

      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },

        {
          role: 'user',
          content: message,
        },
      ],

      temperature: 0.6,

      max_tokens: 1000,
    });


    // ================================
    // RESPOSTA
    // ================================

    const response =
      completion.choices?.[0]?.message?.content;


    if (!response) {
      return res.status(500).json({
        error: 'A IA não retornou uma resposta.',
      });
    }


    return res.status(200).json({
      response,
    });

  } catch (error: unknown) {

    console.error('Erro AutoPulse AI:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido ao consultar a IA.';


    return res.status(500).json({
      error: message,
    });
  }
}
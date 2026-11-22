/* ============================================================================
 *  OPERAÇÃO DENGO — ARQUIVO CENTRAL DE PERSONALIZAÇÃO
 * ----------------------------------------------------------------------------
 *  Tudo que é texto, nome, cor ou detalhe pessoal mora aqui.
 *  Procure por  ✏️ PERSONALIZE  para os pontos que valem a pena editar.
 *  Nada aqui inventa fatos sobre vocês dois: os espaços pessoais estão
 *  marcados e vêm com um texto neutro até você trocar.
 * ==========================================================================*/

export type Mood =
  | 'idle'
  | 'happy'
  | 'panic'
  | 'nervous'
  | 'sad'
  | 'love'
  | 'confused'
  | 'proud'
  | 'dizzy'
  | 'focused'

export type Line = { text: string; mood?: Mood; auto?: number }

export const people = {
  /** ✏️ PERSONALIZE — nome dela. Se ficar vazio, o robô a chama de "Agente". */
  herName: '',
  /** ✏️ PERSONALIZE — seu nome (aparece no final e em algumas piadas). */
  myName: 'Thiago',
  /** Nome do robô. */
  robotName: 'R-404',
}

/** Como o robô se refere a ela durante a operação. */
export const agentName = () => (people.herName.trim() ? people.herName.trim() : 'Agente')

export const meta = {
  title: 'OPERAÇÃO: DENGO NÃO É CONTRATO',
  shortTitle: 'OP. DENGO',
  subtitle: 'Uma investigação altamente suspeita sobre duas pessoas.',
  os: 'DENGO-OS v0.9 (beta eterno)',
}

/** ✏️ PERSONALIZE — paleta. Os mesmos valores alimentam o CSS e o 3D. */
export const palette = {
  night: '#0b0918',
  deep: '#151130',
  violet: '#7c6cff',
  lavender: '#c9bfff',
  pink: '#ff6fa5',
  coral: '#ff9a7a',
  cyan: '#7ff3ff',
  gold: '#ffd27a',
  shell: '#ece9ff',
  alert: '#ff3b5c',
}

export const audioPrefs = {
  /** Volume inicial (0 a 1). O som só liga se ela escolher. */
  defaultVolume: 0.7,
  /** Música ambiente durante a investigação. */
  ambientMusic: true,
}

/* ----------------------------------------------------------------------------
 *  BOOT E TELAS DE CARREGAMENTO
 * --------------------------------------------------------------------------*/
export const boot = {
  lines: [
    'iniciando DENGO-OS...',
    'montando unidade de sentimentos... falhou',
    'tentando de novo com mais carinho... ok',
    'robô R-404: acordado (contra a vontade)',
    'nível de racionalidade: 3%',
  ],
  question: 'Esta experiência fica melhor com som.',
  soundOn: 'LIGAR O SOM',
  soundOff: 'SEGUIR EM SILÊNCIO',
}

export const loadingPhrases = [
  'Calculando sentimentos...',
  'Consultando o departamento de dengo...',
  'Tentando entender seres humanos...',
  'Reiniciando racionalidade...',
  'A saudade não responde em milissegundos.',
  'Carregando coragem do Thiago...',
  'Este processo pode levar uma vida inteira. Brincadeira. Talvez.',
  'Desembaraçando os fios do coração...',
  'Ignorando o manual de instruções (não existe)...',
  'Aquecendo cobertores em segundo plano...',
]

/* ----------------------------------------------------------------------------
 *  FASE 1 — INCIDENTE NO SISTEMA
 * --------------------------------------------------------------------------*/
export const intro = {
  alerts: [
    'ERRO CRÍTICO: sentimentos detectados.',
    'Possível exposição a carinho.',
    'Sentimentos identificados fora do horário de expediente.',
    'Nível de dengo excedeu parâmetros.',
    'Tentando calcular probabilidade de saudade...',
    'Erro: sentimento não possui unidade de medida.',
    'Solicitando ajuda ao departamento de racionalidade...',
    'Departamento inexistente.',
  ],
  lookLines: [
    { text: '...', mood: 'nervous' },
    { text: 'Você está aí?', mood: 'nervous' },
    { text: 'Precisamos investigar uma situação.', mood: 'focused' },
  ] as Line[],
  startButton: 'INICIAR INVESTIGAÇÃO',
}

/* ----------------------------------------------------------------------------
 *  FASE 2 — CENTRAL DE OPERAÇÕES
 * --------------------------------------------------------------------------*/
export const operations = {
  welcome: [
    { text: 'Bem-vinda à Central de Operações. Por favor, não repare a bagunça. Nem o café.', mood: 'happy' },
    { text: 'Toque nos objetos para investigar. Eu fico aqui fingindo que entendo de tudo.', mood: 'proud' },
  ] as Line[],
  dragHint: 'arraste para olhar em volta',
  labels: {
    computer: 'Computador',
    coffee: 'Máquina de café',
    redButton: 'NÃO APERTE',
    box: 'Caixa misteriosa',
    door: 'Porta',
    robot: 'R-404',
  },
  computer: {
    title: 'ANÁLISE DE RELACIONAMENTO',
    start: 'Análise de relacionamento iniciada.',
    stats: [
      { label: 'Cobrança por resposta imediata', value: '0%', bar: 0 },
      { label: 'Fiscalização de horários', value: '0%', bar: 0 },
      { label: 'Obrigação de abandonar hobbies', value: '0%', bar: 0 },
      { label: 'Controle sobre amizades', value: '0%', bar: 0 },
      { label: 'Dengo disponível', value: 'ilimitado, mediante solicitação', bar: 1 },
      { label: 'Saudade', value: 'impossível calcular', bar: -1 },
      { label: 'Vontade de conversar', value: 'suspeitamente alta', bar: 0.93 },
      { label: 'Chance de rir de piadas ruins', value: 'em investigação', bar: -2 },
    ],
    calculating: 'Calculando conclusão final...',
    error: 'Erro 404: racionalidade não encontrada.',
    after: [
      { text: 'Isso... não era para ter confete.', mood: 'confused' },
      { text: 'Vou registrar como "sucesso parcial".', mood: 'proud' },
    ] as Line[],
  },
  coffee: {
    question: 'Qual protocolo devemos executar?',
    optionDengo: 'Receber dengo',
    optionSpace: 'Respeitar meu espaço',
    dengo: [
      { text: 'PROTOCOLO DE DENGO EM EXECUÇÃO!', mood: 'panic' },
      { text: '48 cobertores. 17 chocolates. Um travesseiro gigante. Um urso maior que eu. E uma pequena fortaleza.', mood: 'proud' },
            { text: 'Calma. O protocolo de dengo foi executado com 847% de eficiência.', mood: 'love' },
    ] as Line[],
    space: [
      { text: 'Entendido. Gerando espaço pessoal...', mood: 'focused' },
      { text: 'Espaço pessoal concedido.', mood: 'happy' },
      { text: 'Não invadiremos sua órbita.', mood: 'proud' },
    ] as Line[],
    again: [{ text: 'A máquina ainda funciona. Quer testar o outro protocolo?', mood: 'happy' }] as Line[],
  },
  redButton: {
    before: [{ text: 'Não. Não, não, não. Esse botão é sério.', mood: 'nervous' }] as Line[],
    chaos: 'PARABÉNS. VOCÊ ATIVOU O PROTOCOLO DE DENGO.',
    sign: 'Eu avisei.',
    after: [
      { text: 'Eu avisei.', mood: 'sad' },
      { text: 'Bom... já que apertou: o dengo agora está ativo em toda a estação. Sem volta.', mood: 'love' },
    ] as Line[],
  },
  box: {
    layers: ['Caixa', 'Outra caixa', 'Caixa menor', 'Caixinha'],
    note: 'CAIXA DE EXPECTATIVAS: vazia. Aqui ninguém espera nada de você. Só que você esteja bem.',
    lines: [
      { text: 'Uma caixa dentro de uma caixa dentro de uma caixa...', mood: 'confused' },
      { text: 'Espera... isso é... um MILK MOO INFINITO? Item LENDÁRIO! Ele nunca acaba!', mood: 'love' },
      { text: 'Pode tocar nele. Por sua conta e risco. A física não se responsabiliza.', mood: 'happy' },
    ] as Line[],
  },
  doorLocked: [{ text: 'A porta só abre depois de investigar mais um pouquinho. Regras do departamento. Que eu inventei agora.', mood: 'proud' }] as Line[],
  doorOpen: [{ text: 'Coleta de dados suficiente! Próxima etapa: o Simulador. Ele é muito sério. Muito.', mood: 'focused' }] as Line[],
}

/* ----------------------------------------------------------------------------
 *  FASE 3 — SIMULADOR DE RELACIONAMENTO
 * --------------------------------------------------------------------------*/
export type SimChoice = {
  id: string
  label: string
  reaction: string // nome da animação 3D
  lines: Line[]
  toast?: string
}
export type SimSituation = {
  id: string
  title: string
  setup: string[]
  question: string
  choices: SimChoice[]
}

export const simulator = {
  header: 'SIMULADOR DE RELACIONAMENTO PROFISSIONAL',
  version: 'v3.1 — edição extremamente séria',
  intro: [
    { text: 'Bem-vinda ao Simulador. Aqui testamos situações de relacionamento com rigor científico.', mood: 'focused' },
    { text: 'Não existe resposta errada. Só respostas que me fazem passar vergonha.', mood: 'happy' },
  ] as Line[],
  situations: [
    {
      id: 's1',
      title: 'SITUAÇÃO 1 — DEMORA PARA RESPONDER',
      setup: ['Você enviou uma mensagem.', 'Passaram-se cinco horas.'],
      question: 'Qual procedimento deve ser adotado?',
      choices: [
        {
          id: 'investigate',
          label: 'Enviar 37 mensagens e iniciar investigação federal',
          reaction: 'investigate',
          lines: [
            { text: 'Investigação iniciada.', mood: 'focused' },
            { text: 'Análise das evidências concluída. Suspeito: provavelmente estava tomando banho.', mood: 'confused' },
            { text: 'Caso arquivado. Eu vou desfazer esse mural com calma.', mood: 'sad' },
          ],
        },
        {
          id: 'life',
          label: 'Imaginar que ela está ocupada vivendo a própria vida',
          reaction: 'achievement',
          toast: 'Habilidade desbloqueada: possuir uma vida própria',
          lines: [{ text: 'Parabéns. Habilidade desbloqueada: possuir uma vida própria.', mood: 'proud' }],
        },
        {
          id: 'meme',
          label: 'Enviar um meme quando tiver vontade',
          reaction: 'meme',
          lines: [
            { text: 'Meme enviado. Nível de cobrança: zero. Nível de risada: em análise.', mood: 'happy' },
            { text: 'Comunicação estabelecida com sucesso. Sem prazo de resposta.', mood: 'proud' },
          ],
        },
      ],
    },
    {
      id: 's3',
      title: 'SITUAÇÃO 2 — CONVITE PARA FESTA',
      setup: ['Ela foi convidada para uma festa.', 'Ela quer ir.'],
      question: 'Qual protocolo o robô deve seguir?',
      choices: [
        {
          id: 'report',
          label: 'Exigir relatório de 40 páginas, lista de convidados e horário de volta',
          reaction: 'report',
          lines: [
            { text: 'Gerando formulário de saída... campo 1: "por quê?". Campo 2: "por quê, mas com detalhes"...', mood: 'focused' },
            { text: 'Espera. Ninguém precisa de alvará pra dançar.', mood: 'confused' },
            { text: 'Formulário rasgado. O departamento de festas agradece.', mood: 'proud' },
          ],
        },
        {
          id: 'calls',
          label: 'Ligar a cada 15 minutos para "saber se está tudo bem"',
          reaction: 'calls',
          lines: [
            { text: 'Ligação 1... ligação 2... ligação 14...', mood: 'nervous' },
            { text: 'Ela não atendeu porque estava SE DIVERTINDO. Que é exatamente o objetivo de uma festa.', mood: 'confused' },
            { text: 'Telefone confiscado. Por mim mesmo.', mood: 'sad' },
          ],
        },
        {
          id: 'enjoy',
          label: 'Desejar que ela se divirta muito',
          reaction: 'party',
          toast: 'Lição aprendida: ela pode sair sem dar explicações',
          lines: [
            { text: 'Protocolo correto! Ela pode sair, se divertir e ter a própria vida. Sem relatório, sem satisfação.', mood: 'happy' },
            { text: 'E se ela quiser contar como foi depois, eu adoro ouvir. Se não quiser, a festa continua sendo dela.', mood: 'love' },
          ],
        },
      ],
    },
  ] as SimSituation[],
  emergency: {
    title: 'SITUAÇÃO 3 — DIA DE DENGO',
    setup: 'Uma agente está passando por um dia difícil.',
    alarm: 'EMERGÊNCIA DETECTADA',
    protocol: 'PROTOCOLO DE DENGO',
    instructions: 'Toque em cada item para verificar.',
    items: [
      { label: 'Abraços', status: 'recomendado, se desejados', tone: 'ok' },
      { label: 'Comida', status: 'investigar preferência', tone: 'info' },
      { label: 'Elogios', status: 'alta prioridade', tone: 'ok' },
      { label: 'Respeitar o humor', status: 'obrigatório', tone: 'ok' },
      { label: 'Perguntar se precisa de algo', status: 'inteligente', tone: 'ok' },
      { label: 'Tentar resolver todos os problemas do universo', status: 'não recomendado', tone: 'warn' },
      { label: 'Dizer "você está exagerando"', status: 'sistema encerrado por motivos de segurança', tone: 'danger' },
    ],
    shutdown: 'SISTEMA ENCERRADO POR MOTIVOS DE SEGURANÇA',
    reboot: 'reiniciando com mais empatia...',
    lines: [
      { text: 'Missão de alto risco. Capacete, chocolates e primeiros socorros emocionais: confere.', mood: 'focused' },
      { text: 'Conclusão do protocolo: recomenda-se perguntar o que ela deseja.', mood: 'love' },
      { text: 'E se for dia de TPM: chocolate, paciência e zero comentário engraçadinho. Inclusive meu.', mood: 'happy' },
    ] as Line[],
  },
  outro: [{ text: 'Simulação concluída. Resultado: eu sou péssimo em relacionamentos. Mas aprendi bastante.', mood: 'happy' },
    { text: 'Agora tem uma sala antiga que eu preciso te mostrar. Ela é meio... feia.', mood: 'nervous' }] as Line[],
}

/* ----------------------------------------------------------------------------
 *  FASE 4 — INVENTÁRIO DE DENGO
 * --------------------------------------------------------------------------*/
export type ItemId = 'milkmoo' | 'dengo' | 'pass' | 'memes' | 'hug' | 'quiet' | 'premium' | 'ram' | 'battery'

export const inventory = {
  title: 'INVENTÁRIO DE DENGO',
  note: 'Aqui nada precisa ser conquistado. Já é tudo seu.',
  hint: 'Arraste para girar · pinça para ampliar · toque no objeto',
  intro: [
    { text: 'Este é o seu kit de campo. Pode examinar tudo. Girar, ampliar, apertar.', mood: 'happy' },
    { text: 'Nenhum item tem preço, prazo ou letra miúda. Eu conferi. Duas vezes.', mood: 'proud' },
  ] as Line[],
  outro: [{ text: 'Kit de campo conferido.', mood: 'proud' }] as Line[],
  items: [
    { id: 'milkmoo', name: 'Milk Moo Infinito', desc: 'ITEM LENDÁRIO. Nunca acaba. Cientistas não sabem explicar. O robô também não.', poke: 'reabastecido!', legendary: true },
    { id: 'dengo', name: '+1 Dengo', desc: 'Pode ser solicitado sem burocracia.', poke: 'squish!' },
    { id: 'pass', name: 'Passe de Liberdade Infinita', desc: 'Não possui validade. Não precisa ser devolvido.', poke: 'tlin!' },
    { id: 'memes', name: 'Pacote de Memes', desc: 'Recurso fundamental para manter a comunicação funcionando.', poke: 'kkkk' },
    { id: 'hug', name: 'Abraço de Emergência', desc: 'Disponível mediante consentimento e proximidade física.', poke: 'abraço carregado' },
    { id: 'quiet', name: 'Direito de Ficar Quietinha', desc: 'Ativação: quando simplesmente quiser ficar na sua.', poke: 'shhh' },
    { id: 'premium', name: 'Dengo Premium', desc: 'Cobertura para dias difíceis, saudade, TPM e vontade inexplicável de receber carinho.', poke: 'modo burrito' },
    { id: 'ram', name: 'Memória RAM Emocional', desc: 'Capacidade de ouvir a mesma história várias vezes e continuar interessado.', poke: 'história salva' },
    { id: 'battery', name: 'Bateria Social', desc: 'Não pode ser carregada por terceiros. Respeite o tempo de carregamento.', poke: 'carregando no tempo dela' },
  ] as { id: ItemId; name: string; desc: string; poke: string; legendary?: boolean }[],
}

/* ----------------------------------------------------------------------------
 *  FASE 5 — LIBERDADE
 * --------------------------------------------------------------------------*/
export const freedom = {
  sign: 'RELACIONAMENTO MAL CONFIGURADO',
  intro: [
    { text: 'Encontrei isso nos arquivos antigos. Um sistema de relacionamento cheio de bugs.', mood: 'sad' },
    { text: 'Algemas, contratos, rastreadores... quem programou isso não entendia nada.', mood: 'confused' },
    { text: 'Me ajuda a desmontar? Toque em cada peça.', mood: 'focused' },
  ] as Line[],
  objects: [
    { id: 'cuffs', name: 'Algemas', quip: 'Algemas: desativadas. Ninguém aqui é de ninguém.' },
    { id: 'contract', name: 'Contrato de 78 páginas', quip: '78 páginas triturados. Cláusula de dengo não exige assinatura.' },
    { id: 'gps', name: 'GPS de rastreamento', quip: 'GPS desligado. A única coisa que eu rastreio agora é se você sorriu.' },
    { id: 'insta', name: 'Seguidômetro 3000', quip: 'Seguidômetro 3000: desligado para sempre. Confiança não precisa de radar.' },
  ],
  /** Seguidômetro 3000 — o robô tenta monitorar quem ela segue no Instagram e desiste. */
  insta: {
    title: 'SEGUIDÔMETRO 3000',
    subtitle: 'monitoramento de seguidores do Instagram',
    before: [
      { text: 'Opa, esse aqui parece útil! "Seguidômetro 3000". Monitora quem ela segue no Instagram.', mood: 'happy' },
      { text: 'Ativando...', mood: 'focused' },
    ] as Line[],
    scan: [
      'Conectando ao Instagram...',
      'Analisando perfis seguidos...',
      'Encontrado: 1 página de gatos fazendo coisas de gato',
      'Encontrado: 4 receitas que ela nunca vai fazer',
      'Encontrado: memes. Muitos memes.',
      'Encontrado: pessoas. Porque ela é uma pessoa. Que segue pessoas.',
    ],
    realize: [
      { text: '...espera.', mood: 'confused' },
      { text: 'Por que eu estou fazendo isso? Quem ela segue é assunto DELA.', mood: 'sad' },
      { text: 'Isso não é segurança. Isso é desconfiança com interface bonita.', mood: 'focused' },
    ] as Line[],
    switchLabel: 'DESLIGAR PARA SEMPRE',
    after: [
      { text: 'SISTEMA DESTRUÍDO COM SUCESSO. E com drama, como manda o protocolo.', mood: 'proud' },
      { text: 'Pode seguir quem quiser. A única coisa que eu sigo é a regra: confiança, liberdade e carinho.', mood: 'love' },
    ] as Line[],
  },
  messages: [
    'Talvez gostar de alguém não precise significar deixar de ser livre.',
    'Você continua tendo sua vida, seus sonhos, seu espaço, seus amigos, suas vontades e seu próprio universo.',
    'Eu não quero ser dono da sua órbita.',
    'Se algum dia você quiser se aproximar, gostaria que fosse porque você tem vontade.',
  ],
}

/* ----------------------------------------------------------------------------
 *  FASE 6 — MISSÃO FINAL E O PEDIDO
 * --------------------------------------------------------------------------*/
export const finale = {
  notification: 'MISSÃO FINAL DISPONÍVEL',
  nervous: [
    { text: 'Ah. Não. Missão final?', mood: 'panic' },
    { text: 'Eu não fui programado para esta parte.', mood: 'nervous' },
  ] as Line[],
  robot: [
    { text: 'Após milhares de cálculos, milhões de possibilidades e uma quantidade preocupante de bugs...', mood: 'focused' },
    { text: 'Concluímos que eu gosto muito de você.', mood: 'love' },
    { text: '...', mood: 'nervous' },
    { text: 'Na verdade, esse cálculo foi feito pelo Thiago.', mood: 'happy' },
    { text: 'Eu só estou cuidando da parte tecnológica.', mood: 'proud' },
  ] as Line[],
  /** ✏️ PERSONALIZE — o pedido. Cada item aparece sozinho, com calma. */
  proposal: [
    'Eu gosto muito de você.',
    'Não quero que gostar de mim se transforme em uma obrigação, nem que você sinta que precisa abrir mão da sua liberdade para estar comigo.',
    'Eu não quero mudar seu jeito de ser, nem te prender.',
    'Quero que a gente possa se divertir, rir, fazer besteira, ter nossos momentos de carinho e também nossos momentos individuais.',
    'Quero ser alguém com quem você possa contar, alguém que te faça sorrir e que você tenha vontade de ter por perto.',
    'Eu não quero que você me escolha por obrigação.',
    'Quero que seja algo que você também tenha vontade de viver.',
  ],
  question: 'Você gostaria de namorar comigo?',
  yes: 'SIM, VAMOS TENTAR ❤️',
  no: 'NÃO, MAS O ROBÔ CONTINUA SENDO MEU AMIGO',
  yesEnding: {
    lines: ['MISSÃO CONCLUÍDA.', 'Novo status desbloqueado: NÓS DOIS.', 'Observação importante: o espaço individual continua sendo uma funcionalidade permanente.'],
    sign: 'Agora posso finalmente fechar essa planilha?',
    dossierTitle: 'ARQUIVO Nº 001 — CASO ENCERRADO',
    dossierStamp: 'APROVADO PELOS DOIS',
    /** ✏️ PERSONALIZE — uma frase sua para a última tela (opcional). */
    lastWords: 'A partir de hoje, a investigação continua. Só que agora a gente faz junto.',
    credits: [
      ['Direção, roteiro e coragem', 'Thiago'],
      ['Parte tecnológica', 'R-404'],
      ['Estrela principal', '{her}'],
      ['Departamento de racionalidade', 'inexistente'],
    ],
  },
  noEnding: {
    lines: [
      'Obrigado por responder com sinceridade.',
      'Não existe resposta errada quando se trata de sentimentos.',
      'Você continua sendo uma pessoa especial, independentemente da resposta.',
      'Missão encerrada com respeito.',
    ],
    friend: 'O R-404 continua sendo seu amigo. Essa amizade não tem prazo de validade.',
  },
}

/* ----------------------------------------------------------------------------
 *  EASTER EGGS
 * --------------------------------------------------------------------------*/
export const easterEggs = {
  robotClicks: {
    5: 'Oi. Sim, eu sou clicável. Não, isso não é um convite.',
    9: 'Você já clicou em mim 9 vezes. Estou contando.',
    14: 'Você já clicou em mim 14 vezes. Isso é assédio robótico.',
    20: 'Vou chamar meu advogado. Ele também é um robô.',
    27: 'Meu advogado disse que você tem um ótimo dedo. Ele foi demitido.',
    40: 'Ok, você venceu. Pode clicar. Eu gosto da atenção. Não conta pra ninguém.',
  } as Record<number, string>,
  diagnosis: {
    title: 'DIAGNÓSTICO EMOCIONAL',
    steps: ['Escaneando circuitos...', 'Medindo temperatura das bochechas...', 'Comparando com humanos de referência...'],
    results: [
      '100% incapaz de compreender humanos.',
      'Sentimentos detectados.',
      'Recomenda-se consultar uma pessoa apaixonada.',
    ],
  },
  secretRoom: {
    posterText: 'PROIBIDO SENTIMENTOS APÓS AS 18H',
    found: [{ text: 'Ei... como você achou essa porta? Era pra ser segredo.', mood: 'nervous' }] as Line[],
    title: 'sala secreta',
    /** ✏️ PERSONALIZE — escreva aqui uma mensagem só sua, sem piadas. */
    message:
      'Aqui não tem piada, nem robô, nem alarme. Só eu querendo dizer que fico feliz de verdade quando a gente conversa. Obrigado por ter vindo até aqui.',
    signature: '— Thiago',
  },
  chaos: {
    on: [{ text: 'MODO CAOS ATIVADO. A gravidade pediu demissão!', mood: 'dizzy' }] as Line[],
    off: [{ text: 'Gravidade restaurada. Ela voltou sem pedir desculpas.', mood: 'sad' }] as Line[],
  },
  /** Toques repetidos no Milk Moo Infinito (no Inventário). */
  milkMoo: {
    5: 'O copo encheu de novo. Sozinho. Estou com medo.',
    3: 'Milk Moo infinito confirmado. A física pediu licença.',
    8: 'Estoque mundial de Milk Moo em risco. Mentira, ele é infinito.',
    12: 'Uma vaca foi contratada como consultora técnica da estação.',
    16: 'O robô abriu uma franquia de Milk Moo no anel 3 da estação.',
    21: 'Relatório: o universo agora é 12% Milk Moo. E subindo.',
    27: 'A vaca pediu aumento. Concedido. Ela merece.',
    35: 'Fim da linha. O Milk Moo venceu. Rendição total e feliz.',
  } as Record<number, string>,
  milkMooHub: 'Detectado no sistema: 1 Milk Moo Infinito. Classificação: LENDÁRIO. Origem: piada interna altamente confidencial.',
  planetTap: 'Toque mais duas vezes e eu não me responsabilizo pela gravidade.',
}

/* ----------------------------------------------------------------------------
 *  CONFIGURAÇÕES ABSURDAS
 * --------------------------------------------------------------------------*/
export const settingsText = {
  title: 'CONFIGURAÇÕES',
  real: 'Sistema',
  absurd: 'Configurações absurdas',
  sound: 'Som',
  volume: 'Volume',
  reducedMotion: 'Reduzir animações',
  quality: 'Qualidade gráfica',
  dengo: 'Intensidade do dengo',
  chaos: 'Nível de caos',
  jokes: 'Quantidade de piadas ruins',
  speed: 'Velocidade do robô',
  saudade: 'Probabilidade de saudade',
  saudadeLocked: 'Este valor não é ajustável.',
  clueless: 'Modo "não sei o que estou fazendo"',
  jokeLabels: ['ruins', 'péssimas', 'criminosas', 'de tiozão', 'nível Thiago'],
  restart: 'Recomeçar investigação',
  restartConfirm: 'Toque de novo para confirmar',
}

export const chapters = [
  { id: 'operations', name: 'Central' },
  { id: 'simulator', name: 'Simulador' },
  { id: 'freedom', name: 'Liberdade' },
  { id: 'finale', name: 'Missão Final' },
] as const

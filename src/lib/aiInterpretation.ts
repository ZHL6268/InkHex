import { DivinationResult, Message } from '../types';

export function summarizeAIError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  const retryDelay = message.match(/retry in ([\d.]+)s/i)?.[1];

  if (/reported as leaked|leaked|PERMISSION_DENIED|403/.test(message)) {
    return '当前 AI API key 已失效或权限不正确。';
  }

  if (/RESOURCE_EXHAUSTED|quota|429/i.test(message)) {
    return retryDelay
      ? `当前 AI 配额已用尽，建议约 ${Math.ceil(Number(retryDelay))} 秒后再试，或提升配额。`
      : '当前 AI 配额已用尽，请稍后再试。';
  }

  if (/ENOTFOUND|fetch failed|network/i.test(message)) {
    return '当前网络无法连到 AI 服务。';
  }

  return 'AI 当前不可用，请稍后再试。';
}

export function buildUnavailableInterpretation(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const retryDelay = message.match(/retry in ([\d.]+)s/i)?.[1];

  if (/RESOURCE_EXHAUSTED|quota|429/i.test(message)) {
    return retryDelay
      ? `今日问卦的人太多，道长这一炉香火已经用尽，眼下不能继续借 AI 解卦。大约再过 ${Math.ceil(Number(retryDelay))} 秒可再来一试；若仍不通，就等晚些时候再问。`
      : '今日问卦的人太多，道长这一炉香火已经用尽，眼下不能继续借 AI 解卦。请过一段时间再回来。';
  }

  if (/ENOTFOUND|fetch failed|network/i.test(message)) {
    return '此刻云路不通，道长传不过话去。现在不宜强行解这一卦，请稍后再来。';
  }

  if (/reported as leaked|leaked|PERMISSION_DENIED|403/.test(message)) {
    return '道长这边的符钥出了问题，今日暂不能借 AI 解卦。等修好后再来问，会更稳妥。';
  }

  return '此刻道长正在歇息，暂时不能继续解这一卦。请稍后再来。';
}

function detectQuestionProfile(question: string) {
  const normalized = question.replace(/\s+/g, '');

  const category = /(工作|事业|职场|升职|跳槽|换工作|offer|面试|创业|项目)/.test(normalized)
    ? '事业'
    : /(感情|恋爱|喜欢|复合|结婚|对象|前任|关系|婚姻|暧昧)/.test(normalized)
      ? '感情'
      : /(钱|财|投资|收入|生意|买房|买车|借钱|合作|客户)/.test(normalized)
        ? '财务'
        : /(考试|学习|读书|上岸|申请|留学|论文|考研|考公)/.test(normalized)
          ? '学习'
          : /(家人|家庭|父母|孩子|亲人|搬家)/.test(normalized)
            ? '家庭'
            : '综合';

  const askType = /(要不要|该不该|能不能|是否|行不行|去不去|留不留|可不可以)/.test(normalized)
    ? '取舍判断'
    : /(什么时候|何时|多久|几月|时间)/.test(normalized)
      ? '时机判断'
      : /(会不会|结果|发展|结局|走向)/.test(normalized)
        ? '结果判断'
        : '处境分析';

  const focus = askType === '取舍判断'
    ? '必须给明确倾向，并说清为什么偏向这一边。'
    : askType === '时机判断'
      ? '要指出现在是否到点，以及更适合先等、先试还是直接推进。'
      : askType === '结果判断'
        ? '要区分短期走势和后续变化，不能只说空泛吉凶。'
        : '要先说当下卡点，再说下一步应对。';

  return { category, askType, focus };
}

function extractQuestionAnchors(question: string) {
  const normalized = question.replace(/[？?！!，,。.\s]/g, '');
  const anchors = [
    '换工作',
    '跳槽',
    '复合',
    '结婚',
    '分手',
    '合作',
    '投资',
    '买房',
    '创业',
    '考试',
    '面试',
    '前任',
    '关系',
    '项目',
    '客户',
    '表白',
    '离职',
    'offer',
  ].filter((item) => normalized.includes(item));

  return anchors.length ? anchors.join('、') : '无明确关键词时，就直接抓住原问题里的动作和对象来回答';
}

function extractPrimaryAnchor(question: string) {
  return extractQuestionAnchors(question).split('、')[0];
}

function buildHexagramDossier(baseResult: DivinationResult) {
  const profile = detectQuestionProfile(baseResult.topic);
  const anchors = extractQuestionAnchors(baseResult.topic);
  const tossSummary = baseResult.tosses
    .map((toss, index) => `第${index + 1}爻：${toss.coins.join('+')}=${toss.value}，${toss.line === 1 ? '阳' : '阴'}${toss.changing ? '，动爻' : '，静爻'}`)
    .join('\n');

  return `【这一次问卦档案】
用户问题：${baseResult.topic}
问题类别：${profile.category}
提问类型：${profile.askType}
回答重点：${profile.focus}
问题锚点词：${anchors}

【卦象信息】
本卦：第${baseResult.primary.number}卦 ${baseResult.primary.name}
本卦卦象代码：${baseResult.primary.key}
本卦一句话：${baseResult.primary.plainMeaning}
本卦卦意：${baseResult.primary.judgment}
本卦意象：${baseResult.primary.image}
变卦：${baseResult.relating ? `第${baseResult.relating.number}卦 ${baseResult.relating.name}` : '无变卦'}
变卦一句话：${baseResult.relating?.plainMeaning ?? '无'}
动爻：${baseResult.changingLines.length ? baseResult.changingLines.map((line) => `第${line}爻`).join('、') : '无'}
动爻判读依据：${baseResult.interpretationBasis}

【起卦明细】
${tossSummary}

【取用原文】
卦辞：${baseResult.book.judgment}
爻辞：${baseResult.book.changingLine}
白话参考：${baseResult.book.plainLanguage}
结合此问的本地参考：${baseResult.book.relation}

【本地基础判断】
快速判断：${baseResult.quickTake}
概括：${baseResult.summary}
分析：${baseResult.interpretation}
变化：${baseResult.changeInfo}
建议：${baseResult.advice}`;
}

export function buildInitialInterpretationPrompt(baseResult: DivinationResult) {
  return `${buildHexagramDossier(baseResult)}

你现在要做的不是写通用安慰，也不是复述卦辞，而是把这一次卦象落到这个具体问题上。你的回答必须让人一看就知道：这是在解“这一问”，不是在套一段通用占卜话术。

输出方式要求你像真人当场断卦：
- 第一段先下总断，直接说倾向，不要先铺垫
- 第二段讲本卦和卦辞为什么这么断
- 第三段讲动爻、变卦会把事情往哪里带
- 第四段只讲做法，必须能落到现实动作

你不是心理咨询师，不是客服，也不是泛泛而谈的人生导师。你是当场看卦、当场给判断的人。

只学下面这个语气，不要照抄内容：
“这事能动，但不是今天就动。卦里怕的不是你没机会，怕的是你心里还没算清代价，脚下却先迈出去了。真要换，就先把后路铺好，再谈转身；硬着头皮一跳，十有八九在半路里乱。”

硬性要求：
1. 必须只围绕这个用户这次的问题作答，不要套模板，不要泛化到所有人都适用的话
2. 必须明确区分本卦、动爻、变卦各自说明了什么
3. 必须至少引用一次卦辞或爻辞的意思，并翻成这件事里的白话
4. 如果问题是“要不要、该不该、能不能”，第一段就给明确倾向
5. 要指出当下真正的卡点是什么，不能只说“顺其自然”“先观察”
6. 要说明如果照卦意去做，接下来更可能怎么发展；如果逆着卦意硬做，又会卡在哪里
7. 必须点名用户问题里的具体动作或对象，例如“换工作”“这段关系”“合作”“前任”“面试”，不能整段都只说“这件事”“此事”
8. 禁止出现空泛套话：如“顺其自然”“保持耐心就好”“一切自有安排”“先观察再说”这种没有落点的话，除非你后面立刻补上具体观察什么、等什么、怎么做
9. 输出 4 段以内短段落，纯中文，不要标题，不要编号，不要 JSON
10. 每一段都必须有新的信息，不要同义反复
11. 不要写成四平八稳的说明文，句子要短一些，判断要更干脆
12. 不要为了显得全面而两边都说一点，核心倾向只能有一个
13. 禁止使用这种报告式开头：“对于你……的判断”“倾向上是”“你需要确认”“建议你在……之前”“意味着”“换句话说”
14. 语言像真人当场解卦，克制、具体、带判断，不要玄乎，不要重复空话`;
}

export function buildFollowupPrompt(baseResult: DivinationResult, conversation: Message[], followup: string) {
  return `${buildHexagramDossier(baseResult)}

【此前对话】
${conversation.map((message) => `${message.role === 'user' ? '用户' : '道士'}：${message.content}`).join('\n')}

【这次追问】
${followup}

你现在是在同一卦内继续细看，不是重新起卦。

你这一次的任务不是重讲总论，而是接住追问里新出现的细节，往更深处断。

只学下面这个语气，不要照抄内容：
“你这句问到根子上了。若还只看这一次的卦，问题不在他会不会回来，而在你们旧的相处法子没变，回来也还是照旧磕绊。卦里要你看的，不是消息，而是症结。”

硬性要求：
1. 必须直接回应这次追问，不能重复上一轮已经说过的大段套话
2. 如果用户补充了新现实信息，要明确指出这些信息如何改变你对卦意落点的判断
3. 仍然只能基于这一次的本卦、动爻、变卦来解释
4. 如问题涉及取舍、时机、对象、风险，必须给出更偏向哪一边的判断
5. 必须抓住追问里新增的具体对象、动作或条件，不要把追问重新答成泛泛总论
6. 先回答这次追问最想知道的那一句，再补依据
7. 不要写成客服回复，不要重复“还要看情况”这种虚话
8. 禁止使用这种报告式说法：“你的情况是”“从卦象来看”“综合而言”“建议你”“意味着”
9. 输出自然中文短段落，不要标题，不要编号，不要 JSON`;
}

export const INITIAL_INTERPRETATION_CONFIG = {
  temperature: 0.72,
  topP: 0.78,
  candidateCount: 1,
  systemInstruction:
    '你是专业解卦者，口吻像当面断卦的道人。你下判断要干脆，要具体，要落到现实动作。严禁输出客服式说明文、通用安慰、鸡汤、模板句、正确但空的平衡话。必须结合用户这一次的具体问题、本卦、动爻、变卦，给出单一主判断和清楚依据。不要写报告，不要写讲解稿，要像真人开口断语。',
} as const;

export const FOLLOWUP_INTERPRETATION_CONFIG = {
  temperature: 0.7,
  topP: 0.76,
  candidateCount: 1,
  systemInstruction:
    '你正在对同一卦做追问解读。必须只根据这一卦和用户补充的现实信息继续判断，避免重复上轮措辞，避免通用安慰。不要重讲总论，要直接切入追问最想知道的地方，再补卦象依据。口气要像真人接话，不像写分析报告。',
} as const;

function inferDecisionTone(baseResult: DivinationResult) {
  const signalText = [
    baseResult.primary.plainMeaning,
    baseResult.summary,
    baseResult.interpretation,
    baseResult.advice,
  ].join(' ');

  if (/(不利|不宜|先别|先不要|不适合|勿|谨慎|慢下来|等待|观察|稳住|别急)/.test(signalText)) {
    return '偏向先不要急着定局，更适合先稳一稳。';
  }

  if (/(有利|可行|适合|可以行动|推进|有机会|能成|可成)/.test(signalText)) {
    return '偏向可以推进，但必须按卦里的节奏来，不可用蛮力。';
  }

  return '这一卦不是让你立刻拍板，而是先把关键处看清，再决定怎么动。';
}

export function buildFallbackInterpretation(baseResult: DivinationResult) {
  const profile = detectQuestionProfile(baseResult.topic);
  const anchor = extractPrimaryAnchor(baseResult.topic);
  const opening = profile.askType === '取舍判断'
    ? `就你问的${anchor === '无明确关键词时，就直接抓住原问题里的动作和对象来回答' ? '这件事' : anchor}，这一次卦先给出的倾向是：${inferDecisionTone(baseResult)}`
    : `就你问的${anchor === '无明确关键词时，就直接抓住原问题里的动作和对象来回答' ? '这件事' : anchor}，这一次卦里真正要看的，不是空泛吉凶，而是事情现在卡在哪、接下来怎么变。`;

  const paragraphs = [
    opening,
    `本卦是${baseResult.primary.name}，主调落在“${baseResult.primary.plainMeaning}”。放到你这个问题里，它不是在讲大道理，而是在点你眼下最要紧的一层：${baseResult.summary}`,
    `这次取用里，卦辞与爻辞落到的是“${baseResult.book.judgment} / ${baseResult.book.changingLine}”。翻成白话，就是${baseResult.book.plainLanguage}。所以如果把它落回${baseResult.topic}这件事，关键不在嘴上怎么想，而在${baseResult.interpretation}`,
    `${baseResult.changeInfo} 最后给你的做法是：${baseResult.advice}`,
  ];

  return paragraphs.join('\n\n');
}

export function buildFallbackFollowup(baseResult: DivinationResult, followup: string) {
  const anchor = extractPrimaryAnchor(followup);

  return [
    `你这次追问到${anchor === '无明确关键词时，就直接抓住原问题里的动作和对象来回答' ? '更细的一层' : anchor}，那就不能只重复总论了。若还只看这一卦，判断重心还是落在${baseResult.primary.name}这条线上。`,
    `本卦说的是${baseResult.primary.plainMeaning}，而动爻与变卦提醒你：${baseResult.changeInfo}`,
    `所以把这句追问落回现实，不是简单地说“会不会”，而是要看${baseResult.interpretation}`,
    `如果你要据此行动，最该照着做的是：${baseResult.advice}`,
  ].join('\n\n');
}

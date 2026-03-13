import { BookContent, DivinationResult, HexagramSnapshot, ReadingSections, TossRecord } from './types';

export const PRIEST_AVATAR = "/assets/priest-avatar.png";

const TRIGRAMS: Record<string, { name: string; nature: string; image: string }> = {
  '111': { name: '乾', nature: '天', image: '刚健、向上、开创' },
  '110': { name: '兑', nature: '泽', image: '喜悦、交流、口舌' },
  '101': { name: '离', nature: '火', image: '光明、看见、附丽' },
  '100': { name: '震', nature: '雷', image: '发动、惊醒、突破' },
  '011': { name: '巽', nature: '风', image: '渗透、顺势、入微' },
  '010': { name: '坎', nature: '水', image: '险阻、流动、反复' },
  '001': { name: '艮', nature: '山', image: '止定、边界、收束' },
  '000': { name: '坤', nature: '地', image: '承载、包容、顺应' },
};

let zhouyiClassicalPromise: Promise<Record<number, any>> | null = null;
let zhouyiSitePromise: Promise<Record<number, any>> | null = null;

async function getZhouyiClassical(): Promise<Record<number, any>> {
  if (!zhouyiClassicalPromise) {
    zhouyiClassicalPromise = import('./data/zhouyiClassical').then((module) => module.getZhouyiClassicalMap());
  }

  return zhouyiClassicalPromise;
}

async function getZhouyiSite(): Promise<Record<number, any>> {
  if (!zhouyiSitePromise) {
    zhouyiSitePromise = import('./data/zhouyiSiteData').then((module) => module.getZhouyiSiteData());
  }

  return zhouyiSitePromise;
}

const STANDARD_HEXAGRAMS: Record<string, { number: number; name: string }> = {
  '111111': { number: 1, name: '乾为天' },
  '000000': { number: 2, name: '坤为地' },
  '010100': { number: 3, name: '水雷屯' },
  '001010': { number: 4, name: '山水蒙' },
  '010111': { number: 5, name: '水天需' },
  '111010': { number: 6, name: '天水讼' },
  '000010': { number: 7, name: '地水师' },
  '010000': { number: 8, name: '水地比' },
  '011111': { number: 9, name: '风天小畜' },
  '111110': { number: 10, name: '天泽履' },
  '000111': { number: 11, name: '地天泰' },
  '111000': { number: 12, name: '天地否' },
  '111101': { number: 13, name: '天火同人' },
  '101111': { number: 14, name: '火天大有' },
  '000001': { number: 15, name: '地山谦' },
  '100000': { number: 16, name: '雷地豫' },
  '110100': { number: 17, name: '泽雷随' },
  '001011': { number: 18, name: '山风蛊' },
  '000110': { number: 19, name: '地泽临' },
  '011000': { number: 20, name: '风地观' },
  '101100': { number: 21, name: '火雷噬嗑' },
  '001101': { number: 22, name: '山火贲' },
  '001000': { number: 23, name: '山地剥' },
  '000100': { number: 24, name: '地雷复' },
  '111100': { number: 25, name: '天雷无妄' },
  '001111': { number: 26, name: '山天大畜' },
  '001100': { number: 27, name: '山雷颐' },
  '110011': { number: 28, name: '泽风大过' },
  '010010': { number: 29, name: '坎为水' },
  '101101': { number: 30, name: '离为火' },
  '110001': { number: 31, name: '泽山咸' },
  '100011': { number: 32, name: '雷风恒' },
  '111001': { number: 33, name: '天山遁' },
  '100111': { number: 34, name: '雷天大壮' },
  '101000': { number: 35, name: '火地晋' },
  '000101': { number: 36, name: '地火明夷' },
  '011101': { number: 37, name: '风火家人' },
  '101110': { number: 38, name: '火泽睽' },
  '010001': { number: 39, name: '水山蹇' },
  '100010': { number: 40, name: '雷水解' },
  '001110': { number: 41, name: '山泽损' },
  '011100': { number: 42, name: '风雷益' },
  '110111': { number: 43, name: '泽天夬' },
  '111011': { number: 44, name: '天风姤' },
  '110000': { number: 45, name: '泽地萃' },
  '000011': { number: 46, name: '地风升' },
  '110010': { number: 47, name: '泽水困' },
  '010011': { number: 48, name: '水风井' },
  '110101': { number: 49, name: '泽火革' },
  '101011': { number: 50, name: '火风鼎' },
  '100100': { number: 51, name: '震为雷' },
  '001001': { number: 52, name: '艮为山' },
  '011001': { number: 53, name: '风山渐' },
  '100110': { number: 54, name: '雷泽归妹' },
  '100101': { number: 55, name: '雷火丰' },
  '101001': { number: 56, name: '火山旅' },
  '011011': { number: 57, name: '巽为风' },
  '110110': { number: 58, name: '兑为泽' },
  '011010': { number: 59, name: '风水涣' },
  '010110': { number: 60, name: '水泽节' },
  '011110': { number: 61, name: '风泽中孚' },
  '100001': { number: 62, name: '雷山小过' },
  '010101': { number: 63, name: '水火既济' },
  '101010': { number: 64, name: '火水未济' },
};

const ONE_LINE_MEANINGS: Record<number, string> = {
  1: '主动进取可以有成，但越向前越要守住分寸。',
  2: '眼下更适合稳稳承接，先把基础与位置放正。',
  3: '开局多有阻滞，别急着冲，先把乱局理顺。',
  4: '事情尚未看清，先求明白，再谈决定。',
  5: '时机还在路上，先准备，不必催结果。',
  6: '这件事有争执之象，硬碰硬往往更费力。',
  7: '靠纪律与配合才能推进，不宜各行其是。',
  8: '关键在于找对能同行的人，再谈后续发展。',
  9: '能推进，但力量还小，宜慢慢蓄势。',
  10: '眼下要谨慎行事，守礼守界比逞强更重要。',
  11: '整体趋势在转顺，适合稳中求进。',
  12: '局面有些闭塞，贸然推进容易事倍功半。',
  13: '与人同心则成，单打独斗反而受限。',
  14: '手里有条件，但越有余地越要会节制。',
  15: '放低姿态反而有利，谦能让路更宽。',
  16: '气氛渐起，适合动员，但别只靠一时兴头。',
  17: '顺着对的方向走，比自己硬拧更省力。',
  18: '旧问题需要修补，先治根，再谈新局。',
  19: '机会正在靠近，重要的是提前准备好承接。',
  20: '先观察全局，再决定自己该怎么动。',
  21: '眼前有卡点，要把问题说透、处理干净。',
  22: '外在修饰可以有，但不能代替实质内容。',
  23: '不利硬撑，适合先减负、先保根本。',
  24: '事情有回转迹象，适合重新开始但别操之过急。',
  25: '守真比投机更有用，不要被侥幸心带偏。',
  26: '先积累实力，等真正用得上的时机。',
  27: '你现在最该照看的，是自己的根本需求与节奏。',
  28: '压力偏大，需尽快调整结构，不能长期硬扛。',
  29: '局面有反复，稳住心神比急着脱困更重要。',
  30: '事情需要看清、照亮，别在模糊里行动。',
  31: '关键在彼此感应，真诚比技巧更重要。',
  32: '能走长远的，不是冲劲，而是持续与稳定。',
  33: '该退一步时就退，保存主动权更重要。',
  34: '力量虽强，但用得不对也会伤己伤人。',
  35: '局势在向上，但要靠明朗与表现来争取。',
  36: '眼下不宜太露锋芒，先护住自己。',
  37: '先把内部秩序理顺，外部事情才会跟着顺。',
  38: '分歧难免，重点不是一样，而是如何相处。',
  39: '目前推进不顺，绕路或求助比硬上更明智。',
  40: '困局正在松开，接下来要做的是及时化解。',
  41: '适当减法，反而能让真正重要的部分浮出来。',
  42: '眼下有增长空间，适合把资源投向值得的方向。',
  43: '该表明态度了，但要果断不等于激烈。',
  44: '来得快的机会也可能带来干扰，要会分辨。',
  45: '适合聚人聚力，但先确认大家是不是同心。',
  46: '事情能一步步往上走，稳扎稳打最有利。',
  47: '一时受困并非无路，先守住，再找出口。',
  48: '问题不在资源没有，而在有没有真正用好。',
  49: '需要改变，但变之前先把理由和代价想清楚。',
  50: '局面正在重整，关键是把旧材料炼成新局。',
  51: '突发变化会打乱节奏，但也能逼出真正行动。',
  52: '先停下来，定住心，才知道下一步该不该动。',
  53: '事情适合渐进，不适合一口气求成。',
  54: '位置未稳时不要急着定局，先看清自己处境。',
  55: '看上去机会很多，但越热闹越要抓重点。',
  56: '当前像在过渡阶段，宜轻装、宜灵活。',
  57: '用柔和而持续的方式推进，往往更能入局。',
  58: '沟通能打开局面，但也要防止只停在嘴上。',
  59: '当下适合疏通隔阂，把卡住的地方化开。',
  60: '要先立边界和规则，事情才会稳下来。',
  61: '真诚是这件事最关键的力量，虚张声势无用。',
  62: '宜处理小处，不宜一下子图大图快。',
  63: '事情已有成形之象，但越接近成功越要防松懈。',
  64: '还没真正到终局，先完成最后几步再下结论。',
};

const SPECIAL_HEXAGRAMS: Record<string, Partial<HexagramSnapshot> & Partial<ReadingSections> & { book?: Partial<BookContent> }> = {
  '111111': {
    name: '乾为天',
    palace: '乾宫',
    judgment: '元亨利贞。势在上行，宜正其心，不可只凭一时之勇。',
    image: '天行健，君子以自强不息。',
    summary: '此卦气势昂扬，事情并非不能成，关键在于是否持守正道与节度。',
    interpretation: '你所问之事有启动与突破的机会，但更像一段需要持续发力的路，不是一时冲动便能定局。',
    changeInfo: '若有动爻，往往指向节奏与位置的变化，提醒你在上升势头里留出转圜。',
    advice: '可以行动，但先把目标、底线和代价想明白，再去推门。',
    book: {
      title: '乾为天',
      judgment: '乾：元亨利贞。',
      changingLine: '用九：见群龙无首，吉。',
      plainLanguage: '乾卦讲的是主动、刚健与担当，但真正的强，不是猛冲，而是始终有方向。',
      relation: '这次问事若要推进，贵在先立心，再立势。'
    }
  },
  '000000': {
    name: '坤为地',
    palace: '坤宫',
    judgment: '元亨，利牝马之贞。先迷后得，宜顺势而行。',
    image: '地势坤，君子以厚德载物。',
    summary: '这一卦不主强攻，而主承接、积蓄与等待合适的时点。',
    interpretation: '你问的事情更需要观察环境、整合条件，与其急着推进，不如先稳住基础。',
    changeInfo: '变化未必来自外部机会，而可能来自你是否愿意慢下来，把准备做足。',
    advice: '先顺势，再借势。把关系、资源、时间窗口看清，比立刻表态更重要。',
    book: {
      title: '坤为地',
      judgment: '坤：元亨，利牝马之贞。',
      changingLine: '上六：龙战于野，其血玄黄。',
      plainLanguage: '坤卦看似柔顺，实则讲承担与承托。真正的进展，来自稳稳接住局势。',
      relation: '这件事更适合在沉静中酝酿，而不是在焦虑中定论。'
    }
  },
  '001010': {
    name: '山水蒙',
    palace: '艮宫',
    judgment: '蒙，亨。匪我求童蒙，童蒙求我。宜启蒙，不宜妄断。',
    image: '山下出泉，蒙。君子以果行育德。',
    summary: '事情正处在看不全、问不透的阶段，急着要答案，反而会把自己困住。',
    interpretation: '你问的这件事并非完全没有路，而是当前信息不足、判断容易受情绪与想象放大。',
    changeInfo: '变化点在于你是否愿意先厘清事实，再决定推进或放下。',
    advice: '先问清，再行动。把模糊的部分一个个照亮，局面自然会松动。',
    book: {
      title: '山水蒙',
      judgment: '蒙：亨。匪我求童蒙，童蒙求我。',
      changingLine: '六五：童蒙，吉。',
      plainLanguage: '蒙卦不是坏，而是未明。未明时最怕逞强，最宜受教与自省。',
      relation: '这一问先求看清，不急着求快。'
    }
  }
};

const GENERAL_LINE_TEXT = [
  '初爻主事之开端，提醒你看清起心动念。',
  '二爻近中得位，多与合作、应对和现实条件有关。',
  '三爻处进退之间，常见犹疑、摩擦或过度用力。',
  '四爻临近上层，意味着机会已近，也更考验分寸。',
  '五爻常为主位，多与核心判断、领导力或关键决定相关。',
  '上爻主收束与转折，提示一件事到了该变或该止的关口。'
];

const TOSS_TEXT = ['继续想着这件事。', '再来一次。', '卦意渐明。', '心念勿散。', '最后一爻。'];

export const DIVINATION_PROMPTS = TOSS_TEXT;

function randomCoinSide(): 2 | 3 {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const values = new Uint8Array(1);
    globalThis.crypto.getRandomValues(values);
    return (values[0] & 1) === 0 ? 2 : 3;
  }

  return Math.random() > 0.5 ? 3 : 2;
}

export async function buildHexagramFromTosses(topic: string, tosses: TossRecord[]): Promise<DivinationResult> {
  const zhouyiClassical = await getZhouyiClassical();
  const zhouyiSite = await getZhouyiSite();
  const primaryLines = tosses.map((item) => item.line) as Array<0 | 1>;
  const relatingLines = tosses.map((item) => (item.changing ? (item.line === 1 ? 0 : 1) : item.line)) as Array<0 | 1>;
  const changingLines = tosses
    .map((item, index) => (item.changing ? index + 1 : null))
    .filter((item): item is number => item !== null);

  const primary = makeSnapshot(primaryLines, zhouyiClassical, zhouyiSite);
  const relating = changingLines.length > 0 ? makeSnapshot(relatingLines, zhouyiClassical, zhouyiSite) : null;
  const generated = generateReading(topic, primary, relating, changingLines, zhouyiClassical, zhouyiSite);

  return {
    topic,
    tosses,
    changingLines,
    interpretationBasis: generated.interpretationBasis,
    primary,
    relating,
    ...generated.sections,
    book: generated.book,
  };
}

export function randomTossRecord(): TossRecord {
  const coins = Array.from({ length: 3 }, () => randomCoinSide());
  const value = coins.reduce((sum, item) => sum + item, 0) as 6 | 7 | 8 | 9;
  const line = (value === 7 || value === 9 ? 1 : 0) as 0 | 1;

  return {
    coins,
    value,
    line,
    changing: value === 6 || value === 9,
  };
}

function makeSnapshot(lines: Array<0 | 1>, zhouyiClassical: Record<number, any>, zhouyiSite: Record<number, any>): HexagramSnapshot {
  const lowerKey = `${lines[0]}${lines[1]}${lines[2]}`;
  const upperKey = `${lines[3]}${lines[4]}${lines[5]}`;
  const key = `${upperKey}${lowerKey}`;
  const lower = TRIGRAMS[lowerKey];
  const upper = TRIGRAMS[upperKey];
  const standard = STANDARD_HEXAGRAMS[key];
  const special = SPECIAL_HEXAGRAMS[key];
  const classical = standard ? zhouyiClassical[standard.number] : null;
  const site = standard ? zhouyiSite[standard.number] : null;

  return {
    number: standard?.number ?? 0,
    key,
    name: special?.name ?? site?.name ?? classical?.name ?? standard?.name ?? `${upper.nature}${lower.nature}`,
    palace: special?.palace ?? `第${standard?.number ?? '?'}卦 · 上${upper.name}下${lower.name}`,
    lines,
    plainMeaning:
      site?.summary ??
      (standard?.number ? ONE_LINE_MEANINGS[standard.number] : undefined) ??
      `${upper.nature}与${lower.nature}相遇，关键在看清局势后再决定进退。`,
    judgment: special?.judgment ?? classical?.judgment ?? site?.plain ?? site?.overview ?? `${upper.nature}在上，${lower.nature}在下。此象主${upper.image}与${lower.image}相互牵引。`,
    image: special?.image ?? classical?.image ?? site?.image ?? `${upper.nature}覆于${lower.nature}之上，宜在变化中辨轻重、在行动前定心神。`,
  };
}

function generateReading(
  topic: string,
  primary: HexagramSnapshot,
  relating: HexagramSnapshot | null,
  changingLines: number[],
  zhouyiClassical: Record<number, any>,
  zhouyiSite: Record<number, any>,
): { sections: ReadingSections; book: BookContent; interpretationBasis: string } {
  const special = SPECIAL_HEXAGRAMS[primary.key];
  const primaryClassical = primary.number ? zhouyiClassical[primary.number] : null;
  const relatingClassical = relating?.number ? zhouyiClassical[relating.number] : null;
  const primarySite = primary.number ? zhouyiSite[primary.number] : null;
  const relatingSite = relating?.number ? zhouyiSite[relating.number] : null;
  const interpretationBasis = resolveChangingRule(primary, relating, changingLines);
  const oracleSelection = selectOracleTexts(primary, primaryClassical, primarySite, relating, relatingClassical, relatingSite, changingLines);
  const fallbackSections = buildFallbackSections(topic, primary, relating, changingLines, oracleSelection, interpretationBasis);

  const sections: ReadingSections = {
    quickTake: special?.summary ? `此卦为${primary.name}。${primary.plainMeaning}` : fallbackSections.quickTake,
    summary: special?.summary ?? fallbackSections.summary,
    interpretation: special?.interpretation ?? fallbackSections.interpretation,
    changeInfo: special?.changeInfo ?? fallbackSections.changeInfo,
    advice: special?.advice ?? fallbackSections.advice,
  };

  const lineHint = changingLines.length
    ? changingLines.map((line) => GENERAL_LINE_TEXT[line - 1]).join(' ')
    : '这一问更适合从整体气象去看，不急着抓住单一细节。';

  const book: BookContent = {
    title: special?.book?.title ?? primary.name,
    judgment: special?.book?.judgment ?? oracleSelection.judgment,
    changingLine:
      special?.book?.changingLine ?? (changingLines.length ? oracleSelection.lineFocus : '静卦无动爻，可先观卦辞，再回看自己的处境。'),
    plainLanguage:
      special?.book?.plainLanguage ??
      oracleSelection.commentary ??
      primarySite?.overview ??
      primarySite?.plain ??
      `${primary.name}重在${primary.image.replace('。', '')}，提醒你以更长的时间感去看这件事。`,
    relation:
      special?.book?.relation ??
      (selectTopicReference(topic, primarySite) ||
        `${topic}这一问，不必急着把答案说死。先把当下这一步走稳，卦里的意思才会真正落地。`),
  };

  return { sections, book, interpretationBasis };
}

function buildFallbackSections(
  topic: string,
  primary: HexagramSnapshot,
  relating: HexagramSnapshot | null,
  changingLines: number[],
  oracleSelection: { judgment: string; lineFocus: string; commentary?: string },
  interpretationBasis: string,
): ReadingSections {
  const lens = detectTopicLens(topic);
  const judgmentCore = simplifyClause(oracleSelection.judgment || primary.judgment);
  const lineCore = simplifyClause(oracleSelection.lineFocus);
  const relatingCore = relating ? simplifyClause(relating.plainMeaning) : '';
  const changeSentence = changingLines.length
    ? `动在${changingLines.map((line) => `第${line}爻`).join('、')}，说明这件事不会按原样停住，过程中会有一次明显转向。`
    : '这是一卦静卦，重点不在突然翻盘，而在你怎么理解眼前的形势。';

  return {
    quickTake: `就你问的${lens.label}来看，${primary.plainMeaning}`,
    summary: `本卦是${primary.name}。卦里落到这一问上，重点不是泛泛谈吉凶，而是在提醒你：${judgmentCore}。`,
    interpretation: `你现在问的其实是${lens.concern}。${lens.context} ${primary.name}放在这里，更像是在说${primary.plainMeaning}${lineCore ? ` 卦里取到的句子又特别点出“${lineCore}”，说明关键不只在结果，更在你当下怎么应对。` : ''}`,
    changeInfo: `${changeSentence}${relating ? ` 变卦转到${relating.name}，意思是后面会从“${primary.plainMeaning}”慢慢走向“${relatingCore}”。` : ''} ${interpretationBasis}`,
    advice: `${lens.adviceLead}${buildActionAdvice(lens.key, changingLines.length)}${relating ? ` 如果你准备行动，就以${relating.name}提示的方向去修正节奏。` : ''}`,
  };
}

function simplifyClause(text?: string): string {
  if (!text) return '';
  return text
    .replace(/^本卦第\d+爻[:：]/, '')
    .replace(/^之卦第\d+爻[:：]/, '')
    .replace(/^本次无动爻，以本卦卦辞为主。/, '')
    .replace(/[《》]/g, '')
    .split(/[。；]/)[0]
    .trim();
}

function detectTopicLens(topic: string): {
  key: 'career' | 'relationship' | 'money' | 'study' | 'family' | 'health' | 'decision' | 'generic';
  label: string;
  concern: string;
  context: string;
  adviceLead: string;
} {
  const normalized = topic.replace(/\s+/g, '');

  if (/(工作|事业|职场|升职|跳槽|换工作|offer|面试|创业|项目)/.test(normalized)) {
    return {
      key: 'career',
      label: '事业和去留',
      concern: '要不要动、怎么动、动了值不值得',
      context: '这更像是在看时机、位置和承受后果的能力。',
      adviceLead: '在事业上，先把方向和代价算清，',
    };
  }

  if (/(感情|恋爱|喜欢|复合|结婚|对象|前任|关系|婚姻|暧昧)/.test(normalized)) {
    return {
      key: 'relationship',
      label: '感情和关系',
      concern: '这段关系能不能靠近、该不该继续、怎样相处',
      context: '这类问题往往不只是看对方，更是在看你们之间的互动方式是不是对路。',
      adviceLead: '在关系里，先分清是真靠近还是只是情绪上头，',
    };
  }

  if (/(钱|财|投资|收入|生意|买房|买车|借钱|合作|客户)/.test(normalized)) {
    return {
      key: 'money',
      label: '财务和合作',
      concern: '值不值得投入、风险会不会过大、合作是否可靠',
      context: '这种问题最怕只看眼前利益，不看后续压力与兑现能力。',
      adviceLead: '在钱和合作上，先看风险边界，再谈收益，',
    };
  }

  if (/(考试|学习|读书|上岸|申请|留学|论文|面课|考研|考公)/.test(normalized)) {
    return {
      key: 'study',
      label: '学习和考试',
      concern: '准备是否到位、方法是否正确、后面能不能见效',
      context: '这种事常常不是一把冲刺决定，而是看积累和节奏。',
      adviceLead: '在学习上，先把方法和节奏调顺，',
    };
  }

  if (/(家人|家庭|父母|孩子|亲人|房子|搬家)/.test(normalized)) {
    return {
      key: 'family',
      label: '家庭和家事',
      concern: '关系怎么平衡、决定怎么落地、谁来承担后续',
      context: '家事往往牵涉的不止一个人的情绪，还包括责任与现实安排。',
      adviceLead: '在家事上，先把责任和边界说清，',
    };
  }

  if (/(身体|健康|生病|手术|恢复|治疗|睡眠|焦虑|情绪)/.test(normalized)) {
    return {
      key: 'health',
      label: '身心状态',
      concern: '现在的问题会不会拖大、该休整还是继续硬撑',
      context: '这一类更重视节律、恢复和避免过度透支。',
      adviceLead: '在身体和情绪上，先以稳住状态为先，',
    };
  }

  if (/(要不要|该不该|能不能|是否|行不行|去不去|留不留|选哪个|决定)/.test(normalized)) {
    return {
      key: 'decision',
      label: '取舍和决定',
      concern: '哪条路更合适、现在是否到了表态的时候',
      context: '这种问法本身就说明你还在权衡，不只是缺答案，也在找确定感。',
      adviceLead: '在做决定时，先确认自己最看重的到底是什么，',
    };
  }

  return {
    key: 'generic',
    label: '这件事',
    concern: '它接下来会怎么发展，你该怎么应对',
    context: '卦里看的不是抽象吉凶，而是事情运行的脉络。',
    adviceLead: '先别急着一次把结论说满，',
  };
}

function buildActionAdvice(
  lens: 'career' | 'relationship' | 'money' | 'study' | 'family' | 'health' | 'decision' | 'generic',
  changeCount: number,
): string {
  const movement = changeCount === 0
    ? '先用观察和小幅试探去确认局势，不必急着重手。'
    : changeCount <= 2
      ? '先做一次小动作试水，看外界回不回应，再决定要不要继续加码。'
      : '这件事还在明显变动期，别急着一步定死，边看边调会更稳。';

  switch (lens) {
    case 'career':
      return `${movement} 尤其要看这一步之后，你能不能接住新的责任。`;
    case 'relationship':
      return `${movement} 真正重要的不是表面热度，而是对方有没有稳定回应。`;
    case 'money':
      return `${movement} 账先算明白，合同和承诺也要落到纸面。`;
    case 'study':
      return `${movement} 方法比熬时长更关键，先修正方法。`;
    case 'family':
      return `${movement} 能提前说开的事，就不要拖到情绪上来时再处理。`;
    case 'health':
      return `${movement} 该休息、复查、求助时不要拖。`;
    case 'decision':
      return `${movement} 先排清主次，再做取舍。`;
    default:
      return movement;
  }
}

function selectTopicReference(topic: string, site: any): string {
  if (!site) return '';
  const normalized = topic.replace(/\s+/g, '');

  if (/(工作|事业|职场|升职|跳槽|换工作|offer|面试|创业|项目)/.test(normalized)) {
    return site.career || site.decision || site.overview || '';
  }

  if (/(钱|财|投资|收入|生意|买房|买车|借钱|合作|客户)/.test(normalized)) {
    return site.business || site.decision || site.overview || '';
  }

  if (/(感情|恋爱|喜欢|复合|结婚|对象|前任|关系|婚姻|暧昧)/.test(normalized)) {
    return site.love || site.decision || site.overview || '';
  }

  if (/(考试|学习|读书|上岸|申请|留学|论文|面课|考研|考公|名声|名誉|评价)/.test(normalized)) {
    return site.fame || site.decision || site.overview || '';
  }

  return site.decision || site.fortune || site.overview || site.plain || '';
}

function selectOracleTexts(
  primary: HexagramSnapshot,
  primaryClassical: any,
  primarySite: any,
  relating: HexagramSnapshot | null,
  relatingClassical: any,
  relatingSite: any,
  changingLines: number[],
): { judgment: string; lineFocus: string; commentary?: string } {
  const count = changingLines.length;
  const unchangedLines = [1, 2, 3, 4, 5, 6].filter((line) => !changingLines.includes(line));
  const primaryJudgment = primaryClassical?.judgment ?? primarySite?.plain ?? primary.judgment;
  const relatingJudgment = relatingClassical?.judgment ?? relatingSite?.plain ?? relating?.judgment ?? '';
  const primaryImageComment = primarySite?.overview ?? primarySite?.plain ?? primary.image;

  if (count === 0) {
    return {
      judgment: primaryJudgment,
      lineFocus: '本次无动爻，以本卦卦辞为主。',
      commentary: primaryClassical?.image ?? primarySite?.image ?? primaryImageComment,
    };
  }

  if (count === 1) {
    const line = changingLines[0];
    return getLineSelection(primaryClassical, primarySite, line, `本卦第${line}爻`, primaryJudgment);
  }

  if (count === 2) {
    const ordered = [...changingLines].sort((a, b) => a - b);
    const upperLine = ordered[1];
    const lowerText = getLineSelection(primaryClassical, primarySite, ordered[0], `本卦第${ordered[0]}爻`, primaryJudgment);
    const upperText = getLineSelection(primaryClassical, primarySite, upperLine, `本卦第${upperLine}爻`, primaryJudgment);
    return {
      judgment: primaryJudgment,
      lineFocus: `${lowerText.lineFocus} ${upperText.lineFocus} 两爻并看，以上面的动爻为主。`,
      commentary: upperText.commentary ?? lowerText.commentary,
    };
  }

  if (count === 3) {
    return {
      judgment: `${primaryJudgment} ${relatingJudgment}`.trim(),
      lineFocus: `三爻变时，兼看本卦《${primary.name}》与之卦《${relating?.name ?? ''}》的卦辞。`,
      commentary: relatingClassical?.image ?? relatingSite?.overview ?? relatingSite?.plain ?? primaryImageComment,
    };
  }

  if (count === 4) {
    const ordered = [...unchangedLines].sort((a, b) => a - b);
    const lowerUnchanged = ordered[0];
    const upperUnchanged = ordered[1];
    const lowerText = getLineSelection(relatingClassical, relatingSite, lowerUnchanged, `之卦第${lowerUnchanged}爻`, relatingJudgment);
    const upperText = getLineSelection(relatingClassical, relatingSite, upperUnchanged, `之卦第${upperUnchanged}爻`, relatingJudgment);
    return {
      judgment: relatingJudgment,
      lineFocus: `${lowerText.lineFocus} ${upperText.lineFocus} 四爻变时，取之卦不变爻，以下面的不变爻为主。`,
      commentary: lowerText.commentary ?? upperText.commentary,
    };
  }

  if (count === 5) {
    return getLineSelection(relatingClassical, relatingSite, unchangedLines[0], `之卦第${unchangedLines[0]}爻`, relatingJudgment);
  }

  if (primary.name === '乾为天') {
    return {
      judgment: primaryJudgment,
      lineFocus: `六爻皆动，乾卦取“用九：${primaryClassical?.lines?.['用九'] ?? '见群龍無首，吉。'}”`,
      commentary: primaryClassical?.image ?? primarySite?.overview ?? primaryImageComment,
    };
  }

  if (primary.name === '坤为地') {
    return {
      judgment: primaryJudgment,
      lineFocus: `六爻皆动，坤卦取“用六：${primaryClassical?.lines?.['用六'] ?? '利永貞。'}”`,
      commentary: primaryClassical?.image ?? primarySite?.overview ?? primaryImageComment,
    };
  }

  return {
    judgment: relatingJudgment,
    lineFocus: `六爻皆动，通常以之卦《${relating?.name ?? ''}》的卦辞为主。`,
    commentary: relatingClassical?.image ?? relatingSite?.overview ?? relatingSite?.plain ?? primaryImageComment,
  };
}

function getLineSelection(
  classical: any,
  site: any,
  line: number,
  label: string,
  fallbackJudgment?: string,
): { judgment: string; lineFocus: string; commentary?: string } {
  const classicalLine = resolveClassicalLineText(classical, line);
  return {
    judgment: fallbackJudgment ?? classical?.judgment ?? site?.plain ?? '',
    lineFocus: `${label}：${classicalLine ?? '对应爻辞待补。'}`,
    commentary: site?.overview ?? site?.plain ?? site?.decision,
  };
}

function resolveClassicalLineText(classical: any, line: number): string | undefined {
  if (!classical?.lines) return undefined;

  const keys = [
    line === 1 ? '初九' : '',
    line === 1 ? '初六' : '',
    line === 2 ? '九二' : '',
    line === 2 ? '六二' : '',
    line === 3 ? '九三' : '',
    line === 3 ? '六三' : '',
    line === 4 ? '九四' : '',
    line === 4 ? '六四' : '',
    line === 5 ? '九五' : '',
    line === 5 ? '六五' : '',
    line === 6 ? '上九' : '',
    line === 6 ? '上六' : '',
  ].filter(Boolean);

  return keys.map((key) => classical.lines[key]).find(Boolean);
}

function resolveChangingRule(
  primary: HexagramSnapshot,
  relating: HexagramSnapshot | null,
  changingLines: number[],
): string {
  const count = changingLines.length;

  if (count === 0) {
    return `这一卦以本卦《${primary.name}》的卦辞为主。`;
  }

  if (count === 1) {
    return `这一卦以本卦第${changingLines[0]}爻的爻辞为主。`;
  }

  if (count === 2) {
    return `这一卦有两动爻，通常以两爻爻辞参看，以上面的动爻为主。`;
  }

  if (count === 3) {
    return `这一卦有三动爻，通常兼看本卦与之卦的卦辞，比较两者所示的进退变化。`;
  }

  if (count === 4) {
    return `这一卦有四动爻，通常以之卦的两条不变爻参看，以下面的不变爻为主。`;
  }

  if (count === 5) {
    return `这一卦有五动爻，通常以之卦唯一不变的那一爻为主。`;
  }

  if (primary.name === '乾为天') {
    return '六爻皆动，乾卦依传统以“用九”为主。';
  }

  if (primary.name === '坤为地') {
    return '六爻皆动，坤卦依传统以“用六”为主。';
  }

  return `六爻皆动，通常以之卦《${relating?.name ?? '变卦'}》的卦辞为主。`;
}

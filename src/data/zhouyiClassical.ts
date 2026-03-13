import rawText from './zhouyiClassical.txt?raw';

export interface ZhouyiClassicalEntry {
  number: number;
  name: string;
  judgment: string;
  image?: string;
  lines: Record<string, string>;
}

let parsedCache: Record<number, ZhouyiClassicalEntry> | null = null;

export function getZhouyiClassicalMap(): Record<number, ZhouyiClassicalEntry> {
  if (parsedCache) {
    return parsedCache;
  }

  const entries: Record<number, ZhouyiClassicalEntry> = {};
  const sectionRegex = /\n(\d{1,2})\s+([^\n]+?)(?=\n\d{1,2}\s+|$)/g;
  const content = `\n${rawText}`;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(content))) {
    const number = Number(match[1]);
    const section = match[2].trim();
    const firstLine = section.split('\n')[0]?.trim() ?? '';
    const judgmentMatch = firstLine.match(/^([^，。,]+)[，,](.+)$/);
    const name = judgmentMatch?.[1]?.trim() ?? '';
    const judgment = judgmentMatch?.[2]?.trim() ?? '';

    const imageMatch = section.match(/《象》曰：([^\n]+)/);
    const lineMatches = section.matchAll(/(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六|用九|用六)，([^\n]+)/g);
    const lines: Record<string, string> = {};

    for (const lineMatch of lineMatches) {
      lines[lineMatch[1]] = lineMatch[2].trim();
    }

    if (!name || !judgment) continue;

    entries[number] = {
      number,
      name,
      judgment,
      image: imageMatch?.[1]?.trim(),
      lines,
    };
  }

  parsedCache = entries;
  return entries;
}

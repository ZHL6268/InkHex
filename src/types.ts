export type Screen = 'startup' | 'home' | 'divination' | 'interpretation';

export interface Message {
  id: string;
  role: 'user' | 'priest';
  content: string;
  mood?: 'normal' | 'hint' | 'ritual';
}

export interface TossRecord {
  coins: number[];
  value: 6 | 7 | 8 | 9;
  line: 0 | 1;
  changing: boolean;
}

export interface HexagramSnapshot {
  number: number;
  key: string;
  name: string;
  palace: string;
  lines: Array<0 | 1>;
  plainMeaning: string;
  judgment: string;
  image: string;
}

export interface ReadingSections {
  quickTake: string;
  summary: string;
  interpretation: string;
  changeInfo: string;
  advice: string;
}

export interface BookContent {
  title: string;
  judgment: string;
  changingLine: string;
  plainLanguage: string;
  relation: string;
}

export interface DivinationResult extends ReadingSections {
  topic: string;
  tosses: TossRecord[];
  changingLines: number[];
  interpretationBasis: string;
  primary: HexagramSnapshot;
  relating: HexagramSnapshot | null;
  book: BookContent;
}

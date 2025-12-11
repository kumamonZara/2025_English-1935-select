
export enum AppSection {
  HOME = 'HOME',
  LEAP = 'LEAP',
  TARGET = 'TARGET',
  SCRAMBLE = 'SCRAMBLE',
  STATS = 'STATS',
}

export enum ScrambleCategory {
  USAGE = '語法',
  VOCAB = '語い',
  IDIOM = 'イディオム',
  CONVERSATION = '会話表現',
}

export enum QuizType {
  MCQ_4_ENG_TO_JP = 'MCQ_4_ENG_TO_JP', // English -> 4 Choices (JP) - Random Distractors
  MCQ_4_JP_TO_ENG = 'MCQ_4_JP_TO_ENG', // Japanese -> 4 Choices (Eng) - Random Distractors
  MCQ_FIXED_ENG = 'MCQ_FIXED_ENG', // (Deprecated/Unused) Fixed choices
  INPUT_JP_TO_ENG = 'INPUT_JP_TO_ENG', // Japanese -> Input English
  GAP_FILL = 'GAP_FILL', // Fill in the blank (Input)
  GAP_FILL_MCQ = 'GAP_FILL_MCQ', // Fill in the blank (4 Choice Fixed)
}

export enum SortOrder {
  SEQUENTIAL = 'SEQUENTIAL',
  RANDOM = 'RANDOM',
  ACCURACY_ASC = 'ACCURACY_ASC', // Worst first
}

export interface Word {
  id: number;
  english: string;
  japanese: string;
  section: AppSection;
  scrambleCategory?: ScrambleCategory;
  sentence?: string; // For gap fill
  distractors?: string[]; // For fixed choice
  stats: {
    attempts: number;
    correct: number;
  };
}

export interface HistoryRecord {
  id: string;
  date: string;
  section: AppSection;
  modeDescription: string;
  totalQuestions: number;
  correctCount: number;
  details: HistoryDetail[];
}

export interface HistoryDetail {
  wordId: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizConfig {
  section: AppSection;
  scrambleCategory?: ScrambleCategory;
  type: QuizType;
  order: SortOrder;
  limit?: number; // For "Do 10 random questions"
  onlyReview?: boolean; // If true, only use wrong words
  idRanges?: { start: number; end: number }[]; // Filter by ID range
}

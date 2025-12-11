import { AppSection, ScrambleCategory, Word, HistoryRecord } from '../types';

const STORAGE_KEY_WORDS = 'emaster_words_v10'; // Bump version
const STORAGE_KEY_HISTORY = 'emaster_history_v1';

// Real Data Definitions with Explicit IDs

// LEAP: Academic & Important Words (No Sentences)
const LEAP_DATA = [
  { id: 1, en: 'concept', jp: '概念' },
  { id: 2, en: 'establish', jp: '～を設立する' },
  { id: 3, en: 'indicate', jp: '～を指し示す' },
  { id: 4, en: 'individual', jp: '個々の' },
  { id: 5, en: 'significance', jp: '重要性' },
  { id: 6, en: 'theory', jp: '理論' },
  { id: 7, en: 'factor', jp: '要因' },
  { id: 8, en: 'environment', jp: '環境' },
  { id: 9, en: 'analyze', jp: '～を分析する' },
  { id: 10, en: 'evidence', jp: '証拠' },
];

// TARGET: Exam Frequency Words (No Sentences)
const TARGET_DATA = [
  { id: 1, en: 'admire', jp: '～を賞賛する' },
  { id: 2, en: 'attempt', jp: '～を試みる' },
  { id: 3, en: 'complain', jp: '不平を言う' },
  { id: 4, en: 'defend', jp: '～を守る' },
  { id: 5, en: 'encourage', jp: '～を励ます' },
  { id: 6, en: 'manage', jp: 'どうにか～する' },
  { id: 7, en: 'refuse', jp: '～を断る' },
  { id: 8, en: 'struggle', jp: 'もがく・奮闘する' },
  { id: 9, en: 'suffer', jp: '苦しむ' },
  { id: 10, en: 'warn', jp: '～に警告する' },
];

// SCRAMBLE: Grammar/Usage
const SCRAMBLE_USAGE_DATA = [
  { id: 1, en: 'allow', jp: '～を許可する (allow A to do)', sent: 'Her parents allow her to travel alone.', dis: ['forgive', 'let', 'make'] },
  { id: 2, en: 'suggest', jp: '～を提案する (suggest doing)', sent: 'He suggested going for a walk.', dis: ['to go', 'go', 'gone'] },
  { id: 3, en: 'remind', jp: '～に思い出させる (remind A of B)', sent: 'This song reminds me of my childhood.', dis: ['remembers', 'recalls', 'memorizes'] },
  { id: 4, en: 'prevent', jp: '～を妨げる (prevent A from doing)', sent: 'The rain prevented us from playing soccer.', dis: ['avoided', 'protected', 'rejected'] },
  { id: 5, en: 'rob', jp: '～から奪う (rob A of B)', sent: 'Someone robbed him of his wallet.', dis: ['stole', 'took', 'deprived'] },
  { id: 6, en: 'apologize', jp: '謝罪する (apologize to A for B)', sent: 'I must apologize to you for being late.', dis: ['excuse', 'pardon', 'forgive'] },
  { id: 7, en: 'prefer', jp: '～を好む (prefer A to B)', sent: 'I prefer coffee to tea.', dis: ['than', 'better', 'more'] },
  { id: 8, en: 'worth', jp: '価値がある (be worth doing)', sent: 'This book is worth reading.', dis: ['value', 'worthy', 'valuable'] },
  { id: 9, en: 'used', jp: '慣れている (be used to doing)', sent: 'I am used to getting up early.', dis: ['use', 'usage', 'using'] },
  { id: 10, en: 'help', jp: '～を避ける (cannot help doing)', sent: 'I couldn\'t help laughing at the joke.', dis: ['but laughing', 'to laugh', 'laugh'] },
];

// SCRAMBLE: Vocabulary
const SCRAMBLE_VOCAB_DATA = [
  { id: 1, en: 'fare', jp: '運賃', sent: 'The bus fare has increased.', dis: ['fee', 'cost', 'price'] },
  { id: 2, en: 'appointment', jp: '予約 (面会・診察)', sent: 'I have a dental appointment at 3 pm.', dis: ['reservation', 'booking', 'promise'] },
  { id: 3, en: 'custom', jp: '習慣 (社会的)', sent: 'It is a custom to shake hands.', dis: ['habit', 'manner', 'usage'] },
  { id: 4, en: 'audience', jp: '聴衆', sent: 'The audience clapped loudly.', dis: ['spectator', 'guest', 'visitor'] },
  { id: 5, en: 'shade', jp: '日陰', sent: 'Let\'s sit in the shade.', dis: ['shadow', 'dark', 'light'] },
  { id: 6, en: 'client', jp: '依頼人', sent: 'The lawyer met with his client.', dis: ['customer', 'guest', 'passenger'] },
  { id: 7, en: 'capacity', jp: '収容能力', sent: 'The stadium has a capacity of 50,000.', dis: ['ability', 'capability', 'power'] },
  { id: 8, en: 'harm', jp: '害', sent: 'Smoking does harm to your health.', dis: ['damage', 'hurt', 'injury'] },
  { id: 9, en: 'view', jp: '眺め', sent: 'The view from the top is beautiful.', dis: ['scenery', 'sight', 'look'] },
  { id: 10, en: 'reservation', jp: '予約 (席・部屋)', sent: 'I made a reservation at the restaurant.', dis: ['appointment', 'promise', 'plan'] },
];

// SCRAMBLE: Idioms
const SCRAMBLE_IDIOM_DATA = [
  { id: 1, en: 'look forward to', jp: '～を楽しみに待つ', sent: 'I look forward to seeing you.', dis: ['look up to', 'look out for', 'look down on'] },
  { id: 2, en: 'run out of', jp: '～を使い果たす', sent: 'We ran out of gas.', dis: ['run short of', 'run away', 'run over'] },
  { id: 3, en: 'put off', jp: '～を延期する', sent: 'Don\'t put off your homework.', dis: ['call off', 'put on', 'put out'] },
  { id: 4, en: 'call for', jp: '～を必要とする', sent: 'This situation calls for immediate action.', dis: ['call on', 'call off', 'call up'] },
  { id: 5, en: 'take after', jp: '～に似ている', sent: 'She takes after her mother.', dis: ['look like', 'take over', 'take care'] },
  { id: 6, en: 'bring up', jp: '～を育てる', sent: 'She was brought up in a small village.', dis: ['grow up', 'bring about', 'bring in'] },
  { id: 7, en: 'give in to', jp: '～に屈する', sent: 'He finally gave in to their demands.', dis: ['give up', 'give off', 'give away'] },
  { id: 8, en: 'make up for', jp: '～の埋め合わせをする', sent: 'I worked hard to make up for lost time.', dis: ['make up', 'make out', 'make for'] },
  { id: 9, en: 'carry out', jp: '～を実行する', sent: 'They carried out the plan perfectly.', dis: ['carry on', 'carry away', 'carry over'] },
  { id: 10, en: 'do away with', jp: '～を廃止する', sent: 'We should do away with these old rules.', dis: ['put up with', 'catch up with', 'come up with'] },
];

// SCRAMBLE: Conversation
const SCRAMBLE_CONVERSATION_DATA = [
  { id: 1, en: 'Help yourself.', jp: 'ご自由にどうぞ', sent: 'Please help yourself to the cake.', dis: ['Do it yourself.', 'Take care.', 'Be careful.'] },
  { id: 2, en: 'Hold the line.', jp: '電話を切らずにお待ちください', sent: 'Hold the line, please. I\'ll check for you.', dis: ['Hang up.', 'Call back.', 'Speak up.'] },
  { id: 3, en: 'Go ahead.', jp: 'どうぞ', sent: 'May I use your pen? - Sure, go ahead.', dis: ['Go away.', 'Come here.', 'Watch out.'] },
  { id: 4, en: 'That depends.', jp: '状況次第だね', sent: 'Are you going out? - That depends on the weather.', dis: ['That\'s right.', 'No doubt.', 'I agree.'] },
  { id: 5, en: 'You have the wrong number.', jp: '番号が間違っています', sent: 'I\'m afraid you have the wrong number.', dis: ['bad number', 'mistake number', 'false number'] },
  { id: 6, en: 'Be my guest.', jp: '遠慮なくどうぞ', sent: 'Can I use your phone? - Be my guest.', dis: ['Be careful.', 'Be quiet.', 'Be happy.'] },
  { id: 7, en: 'What a shame!', jp: 'それは残念だ！', sent: 'I failed the test. - What a shame!', dis: ['What a pity!', 'What a surprise!', 'What a mess!'] },
  { id: 8, en: 'Mind your own business.', jp: '余計なお世話だ', sent: 'Why are you so late? - Mind your own business.', dis: ['Care about yourself.', 'Do your job.', 'Watch your step.'] },
  { id: 9, en: 'I can\'t make it.', jp: '都合がつかない', sent: 'Can you come to the party? - Sorry, I can\'t make it.', dis: ['I can\'t do it.', 'I can\'t go.', 'I can\'t take it.'] },
  { id: 10, en: 'Let\'s call it a day.', jp: '今日はここまでにしよう', sent: 'We\'ve done enough work. Let\'s call it a day.', dis: ['Let\'s finish it.', 'Let\'s go home.', 'Let\'s stop it.'] },
];

const generateMockData = (): Word[] => {
  let words: Word[] = [];

  const addWords = (data: any[], section: AppSection, cat?: ScrambleCategory) => {
    data.forEach((item) => {
      words.push({
        id: item.id,
        english: item.en,
        japanese: item.jp,
        section: section,
        scrambleCategory: cat,
        sentence: item.sent, // Undefined for LEAP/Target
        distractors: item.dis, // Undefined for LEAP/Target
        stats: { attempts: 0, correct: 0 },
      });
    });
  };

  addWords(LEAP_DATA, AppSection.LEAP);
  addWords(TARGET_DATA, AppSection.TARGET);
  addWords(SCRAMBLE_USAGE_DATA, AppSection.SCRAMBLE, ScrambleCategory.USAGE);
  addWords(SCRAMBLE_VOCAB_DATA, AppSection.SCRAMBLE, ScrambleCategory.VOCAB);
  addWords(SCRAMBLE_IDIOM_DATA, AppSection.SCRAMBLE, ScrambleCategory.IDIOM);
  addWords(SCRAMBLE_CONVERSATION_DATA, AppSection.SCRAMBLE, ScrambleCategory.CONVERSATION);

  return words;
};

export const dataService = {
  getWords: (): Word[] => {
    const stored = localStorage.getItem(STORAGE_KEY_WORDS);
    if (stored) {
      return JSON.parse(stored);
    }
    const initial = generateMockData();
    localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(initial));
    return initial;
  },

  saveWords: (words: Word[]) => {
    localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(words));
  },

  updateWordStats: (results: { wordId: number; isCorrect: boolean }[], section: AppSection): Word[] => {
    const words = dataService.getWords();
    const updated = words.map((w) => {
      // Since IDs are not unique globally, we must check both ID and Section
      const result = results.find((r) => r.wordId === w.id && w.section === section);
      if (result) {
        return {
          ...w,
          stats: {
            attempts: w.stats.attempts + 1,
            correct: w.stats.correct + (result.isCorrect ? 1 : 0),
          },
        };
      }
      return w;
    });
    dataService.saveWords(updated);
    return updated;
  },

  getHistory: (): HistoryRecord[] => {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
    return stored ? JSON.parse(stored) : [];
  },

  addHistory: (record: HistoryRecord) => {
    const history = dataService.getHistory();
    const updated = [record, ...history];
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  },

  exportCSV: (data: HistoryRecord[] | HistoryRecord): string => {
    if (Array.isArray(data)) {
      // Summary Export
      const headers = ['ID', 'Date', 'Section', 'Mode', 'Questions', 'Correct', 'Rate'];
      const rows = data.map(r => [
        r.id,
        new Date(r.date).toLocaleString(),
        r.section,
        r.modeDescription,
        r.totalQuestions,
        r.correctCount,
        `${((r.correctCount / r.totalQuestions) * 100).toFixed(1)}%`
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      // Detail Export
      const headers = ['Question', 'User Answer', 'Correct Answer', 'Is Correct'];
      const rows = data.details.map(d => [
        `"${d.question.replace(/"/g, '""')}"`,
        `"${d.userAnswer.replace(/"/g, '""')}"`,
        `"${d.correctAnswer.replace(/"/g, '""')}"`,
        d.isCorrect ? 'TRUE' : 'FALSE'
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
  }
};
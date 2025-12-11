import React, { useState, useMemo } from 'react';
import { Word, AppSection } from '../types';
import { Volume2, Trash2, ArrowUpDown, PlayCircle } from 'lucide-react';
import { dataService } from '../services/data';

interface WordListProps {
  words: Word[]; // Filtered words for display
  allWords: Word[]; // All words for data manipulation
  setWords: (words: Word[]) => void;
  sectionFilter: AppSection;
  onStartReview: (words: Word[]) => void;
}

export const WordList: React.FC<WordListProps> = ({ words, allWords, setWords, sectionFilter, onStartReview }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'id' | 'english' | 'japanese' | 'accuracy'>('id');
  const [showMistakesOnly, setShowMistakesOnly] = useState(false);

  // Derived filtered/sorted list based on the passed 'words' prop (which is already filtered by Dashboard)
  const processedWords = useMemo(() => {
    let result = words; // Already filtered by Section and Range in Dashboard

    // Filter by search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (w) =>
          w.english.toLowerCase().includes(lower) ||
          w.japanese.includes(lower) ||
          w.id.toString().includes(lower)
      );
    }

    // Filter by mistakes
    if (showMistakesOnly) {
      result = result.filter(w => w.stats.attempts > 0 && (w.stats.correct / w.stats.attempts) < 1);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'english':
          return a.english.localeCompare(b.english);
        case 'japanese':
          return a.japanese.localeCompare(b.japanese);
        case 'accuracy':
          const rateA = a.stats.attempts === 0 ? 0 : a.stats.correct / a.stats.attempts;
          const rateB = b.stats.attempts === 0 ? 0 : b.stats.correct / b.stats.attempts;
          return rateA - rateB;
        default: // id
          return a.id - b.id;
      }
    });

    return result;
  }, [words, searchTerm, sortKey, showMistakesOnly]);

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const deleteMistake = (id: number) => {
      // Use allWords to update the global state, ensuring we target the correct word by Section + ID
      const newWords = allWords.map(w => {
          if (w.id === id && w.section === sectionFilter) {
              return { ...w, stats: { attempts: 0, correct: 0 } };
          }
          return w;
      });
      setWords(newWords);
      dataService.saveWords(newWords);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="検索 (英/日/ID)..."
            className="border p-2 rounded w-full md:w-64 bg-blue-50 text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
            <select 
                className="border p-2 rounded bg-blue-50 text-black" 
                value={sortKey} 
                onChange={(e) => setSortKey(e.target.value as any)}
            >
                <option value="id">ID順</option>
                <option value="english">ABC順</option>
                <option value="japanese">あいうえお順</option>
                <option value="accuracy">正答率順</option>
            </select>
        </div>
      </div>

      <div className="mb-4 p-4 bg-red-50 rounded border border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-red-700">
                <input 
                    type="checkbox" 
                    checked={showMistakesOnly} 
                    onChange={e => setShowMistakesOnly(e.target.checked)}
                    className="w-4 h-4"
                />
                不正解リストを表示
            </label>
          </div>
          {showMistakesOnly && processedWords.length > 0 && (
              <button 
                onClick={() => onStartReview(processedWords)}
                className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 flex items-center gap-2"
              >
                  <PlayCircle size={16} />
                  このリストで復習 (英→日)
              </button>
          )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm">
              <th className="p-3 border-b">ID</th>
              <th className="p-3 border-b">Word</th>
              <th className="p-3 border-b">Meaning</th>
              <th className="p-3 border-b text-center">Stats</th>
              {showMistakesOnly && <th className="p-3 border-b text-center">Action</th>}
            </tr>
          </thead>
          <tbody>
            {processedWords.map((word) => {
              const rate = word.stats.attempts > 0 
                ? Math.round((word.stats.correct / word.stats.attempts) * 100) 
                : '-';
              return (
                <tr key={`${word.id}-${word.section}`} className="border-b hover:bg-gray-50 text-black">
                  <td className="p-3 text-sm text-black">{word.id}</td>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      {word.english}
                      <button 
                        onClick={() => playAudio(word.english)} 
                        className="text-blue-500 hover:text-blue-700"
                        title="Play Audio"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="p-3">{word.japanese}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                        rate === '-' ? 'bg-gray-200' :
                        rate as number >= 80 ? 'bg-green-100 text-green-800' :
                        rate as number >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {rate === '-' ? 'New' : `${rate}%`}
                    </span>
                  </td>
                  {showMistakesOnly && (
                      <td className="p-3 text-center">
                          <button 
                            onClick={() => deleteMistake(word.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="リストから削除 (成績リセット)"
                          >
                              <Trash2 size={16} />
                          </button>
                      </td>
                  )}
                </tr>
              );
            })}
            {processedWords.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                        該当する単語がありません
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
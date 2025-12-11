import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Word, QuizConfig, QuizType, SortOrder, HistoryRecord, AppSection } from '../types';
import { dataService } from '../services/data';
import { Volume2, XCircle, CheckCircle, Eye } from 'lucide-react';

interface QuizSessionProps {
  allWords: Word[];
  config: QuizConfig;
  onExit: () => void;
  updateGlobalWords: (words: Word[]) => void;
}

export const QuizSession: React.FC<QuizSessionProps> = ({ allWords, config, onExit, updateGlobalWords }) => {
  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false); // Immediate result for current question
  const [sessionResults, setSessionResults] = useState<{word: Word, userAns: string, correct: boolean}[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showJapanese, setShowJapanese] = useState(false); // New state for hint visibility
  
  // MCQ Options
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);

  // Init
  useEffect(() => {
    let filtered = allWords.filter(w => w.section === config.section);
    
    // 1. Filter by Scramble Category
    if (config.scrambleCategory) {
        filtered = filtered.filter(w => w.scrambleCategory === config.scrambleCategory);
    }

    // 2. Filter by ID Ranges
    if (config.idRanges && config.idRanges.length > 0) {
        filtered = filtered.filter(w => 
            config.idRanges!.some(r => w.id >= r.start && w.id <= r.end)
        );
    }

    // 3. Filter by Review only (Mistakes)
    if (config.onlyReview) {
        // If config.onlyReview is true, we usually want to filter from the currently valid pool
        filtered = filtered.filter(w => w.stats.attempts > 0 && (w.stats.correct / w.stats.attempts) < 1);
    }

    // 4. Sort Order
    if (config.order === SortOrder.RANDOM) {
        filtered = [...filtered].sort(() => Math.random() - 0.5);
    } else if (config.order === SortOrder.ACCURACY_ASC) {
        filtered = [...filtered].sort((a, b) => {
             const rateA = a.stats.attempts === 0 ? 0 : a.stats.correct / a.stats.attempts;
             const rateB = b.stats.attempts === 0 ? 0 : b.stats.correct / b.stats.attempts;
             return rateA - rateB;
        });
    } else {
        // Sequential ID
        filtered = [...filtered].sort((a, b) => a.id - b.id);
    }

    // 5. Limit (Must be applied after sorting, especially for random)
    if (config.limit && config.limit > 0) {
        filtered = filtered.slice(0, config.limit);
    }

    setQuestions(filtered);
  }, [allWords, config]);

  // Generate Options for MCQ
  useEffect(() => {
      if (questions.length === 0 || currentIndex >= questions.length) return;

      const currentWord = questions[currentIndex];

      if (config.type === QuizType.GAP_FILL_MCQ) {
          // Fixed options: Defined distractors + Correct English Word
          // Scramble distractors are English, used for filling gaps
          const opts = [...(currentWord.distractors || []), currentWord.english];
          setCurrentOptions(opts.sort(() => Math.random() - 0.5));
      } else if (config.type.includes('MCQ')) {
          // Random generation for standard Vocab checks
          const isEngToJp = config.type === QuizType.MCQ_4_ENG_TO_JP;
          const correctAnswer = isEngToJp ? currentWord.japanese : currentWord.english;
          
          // Pick 3 random distractors from ALL words in the same section to avoid guessing
          const otherWords = allWords.filter(w => w.id !== currentWord.id && w.section === config.section);
          
          const distractors = otherWords
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(w => isEngToJp ? w.japanese : w.english);
          
          // Fill if not enough words
          while (distractors.length < 3) {
             distractors.push('---');
          }
          
          setCurrentOptions([...distractors, correctAnswer].sort(() => Math.random() - 0.5));
      }

      // Auto play audio if english is prompt
      if (config.type === QuizType.MCQ_4_ENG_TO_JP) {
          const utterance = new SpeechSynthesisUtterance(currentWord.english);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
      }

  }, [currentIndex, questions, config, allWords]);


  const handleAnswer = (answer: string) => {
    const currentWord = questions[currentIndex];
    let isCorrect = false;

    if (config.type === QuizType.MCQ_4_ENG_TO_JP) {
        isCorrect = answer === currentWord.japanese;
    } else if (config.type === QuizType.MCQ_4_JP_TO_ENG) {
        isCorrect = answer === currentWord.english;
    } else if (config.type === QuizType.GAP_FILL_MCQ) {
        isCorrect = answer === currentWord.english;
    } else if (config.type === QuizType.INPUT_JP_TO_ENG || config.type === QuizType.GAP_FILL) {
        isCorrect = answer.trim().toLowerCase() === currentWord.english.trim().toLowerCase();
    }

    // Save result
    setSessionResults(prev => [...prev, {
        word: currentWord,
        userAns: answer,
        correct: isCorrect
    }]);

    setUserAnswer(answer);
    setShowResult(true);
    setShowJapanese(true); // Always show translation on result
  };

  const nextQuestion = () => {
    setShowResult(false);
    setShowJapanese(false); // Reset hint state
    setUserAnswer('');
    if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
    } else {
        finishSession();
    }
  };

  const finishSession = () => {
      setIsFinished(true);
      
      // Calculate Stats
      const finalResults = [...sessionResults]; // Ensure we have latest
      
      // Update Global Stats
      const simpleResults = finalResults.map(r => ({ wordId: r.word.id, isCorrect: r.correct }));
      // Pass the section so we can identify the correct word even if IDs are not unique globally
      const newWords = dataService.updateWordStats(simpleResults, config.section);
      updateGlobalWords(newWords);

      // Save History
      const record: HistoryRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          section: config.section,
          modeDescription: `${config.type} - ${config.order}${config.limit ? ` (Limit: ${config.limit})` : ''}`,
          totalQuestions: finalResults.length,
          correctCount: finalResults.filter(r => r.correct).length,
          details: finalResults.map(r => ({
              wordId: r.word.id,
              question: config.type === QuizType.MCQ_4_ENG_TO_JP ? r.word.english : r.word.japanese,
              userAnswer: r.userAns,
              correctAnswer: config.type === QuizType.MCQ_4_ENG_TO_JP ? r.word.japanese : r.word.english,
              isCorrect: r.correct
          }))
      };
      dataService.addHistory(record);
  };

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (questions.length === 0) {
      return (
        <div className="p-8 text-center bg-white rounded shadow m-4">
            <h3 className="text-xl font-bold text-gray-700 mb-2">該当する問題がありません</h3>
            <p className="text-gray-500 mb-4">選択した範囲または条件に一致する単語が見つかりませんでした。</p>
            <button onClick={onExit} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">戻る</button>
        </div>
      );
  }

  if (isFinished) {
      const correctCount = sessionResults.filter(r => r.correct).length;
      return (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg mt-8">
              <h2 className="text-2xl font-bold mb-4 text-center">結果発表</h2>
              <div className="text-center text-4xl font-bold mb-6 text-blue-600">
                  {correctCount} / {sessionResults.length}
              </div>
              <div className="overflow-y-auto max-h-96 border rounded mb-6">
                  <table className="w-full text-left">
                      <thead className="bg-gray-100 sticky top-0 text-black">
                          <tr>
                              <th className="p-2">Q</th>
                              <th className="p-2">Correct</th>
                              <th className="p-2">Result</th>
                          </tr>
                      </thead>
                      <tbody>
                          {sessionResults.map((r, idx) => (
                              <tr key={idx} className="border-b">
                                  <td className="p-2 text-sm text-black">{r.word.english}</td>
                                  <td className="p-2 text-sm text-black">{r.word.japanese}</td>
                                  <td className="p-2 text-center">
                                      {r.correct ? <CheckCircle className="text-green-500 inline" size={20} /> : <XCircle className="text-red-500 inline" size={20} />}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <button 
                onClick={onExit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                  終了して戻る
              </button>
          </div>
      );
  }

  const currentWord = questions[currentIndex];
  const isInput = config.type === QuizType.INPUT_JP_TO_ENG || config.type === QuizType.GAP_FILL;

  return (
    <div className="max-w-2xl mx-auto mt-4 p-4 pb-20"> {/* pb-20 for sticky nav if needed */}
        <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-500">Q {currentIndex + 1} / {questions.length}</span>
            <button onClick={finishSession} className="text-red-500 text-sm border border-red-200 px-3 py-1 rounded hover:bg-red-50">途中終了</button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg mb-6 min-h-[200px] flex flex-col justify-center items-center text-center">
            {config.type === QuizType.GAP_FILL || config.type === QuizType.GAP_FILL_MCQ ? (
                <div>
                     <p className="text-lg text-gray-600 mb-2">Fill in the blank:</p>
                     <p className="text-xl font-medium mb-3">
                        {currentWord.sentence?.replace(currentWord.english, '_______') || '_______'}
                     </p>
                     
                     {showJapanese ? (
                         <p className="text-md text-gray-600 mt-2 font-bold animate-fade-in">({currentWord.japanese})</p>
                     ) : (
                         <button 
                            onClick={() => setShowJapanese(true)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto bg-blue-50 px-3 py-1 rounded-full transition"
                         >
                            <Eye size={16} />
                            日本語訳を表示
                         </button>
                     )}
                </div>
            ) : config.type === QuizType.MCQ_4_ENG_TO_JP ? (
                <div>
                     <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                        {currentWord.english}
                        <button onClick={() => playAudio(currentWord.english)} className="text-blue-500"><Volume2 /></button>
                     </h2>
                </div>
            ) : (
                <div>
                    <h2 className="text-3xl font-bold mb-2">{currentWord.japanese}</h2>
                </div>
            )}
        </div>

        {/* Answer Area */}
        {!showResult ? (
            <div className="space-y-3">
                {isInput ? (
                    <div className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            className="w-full border-2 border-blue-200 bg-blue-50 text-black p-4 rounded-lg text-lg outline-none focus:border-blue-500 placeholder-gray-400"
                            placeholder="Type Answer..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAnswer(userAnswer); }}
                            autoFocus
                        />
                        <button 
                            onClick={() => handleAnswer(userAnswer)}
                            className="bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700"
                        >
                            回答する
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentOptions.map((opt, i) => (
                            <button 
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition text-left"
                            >
                                <span className="inline-block w-6 h-6 bg-gray-100 rounded-full text-center text-sm mr-2">{i+1}</span>
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            <div className={`p-6 rounded-lg mb-4 ${sessionResults[sessionResults.length-1].correct ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                    {sessionResults[sessionResults.length-1].correct 
                        ? <CheckCircle className="text-green-600 w-8 h-8" /> 
                        : <XCircle className="text-red-600 w-8 h-8" />
                    }
                    <span className={`text-xl font-bold ${sessionResults[sessionResults.length-1].correct ? 'text-green-800' : 'text-red-800'}`}>
                        {sessionResults[sessionResults.length-1].correct ? '正解!' : '不正解...'}
                    </span>
                </div>
                <div className="ml-11">
                    <p className="text-gray-700">正解: <span className="font-bold">{config.type === QuizType.MCQ_4_ENG_TO_JP ? currentWord.japanese : currentWord.english}</span></p>
                    <p className="text-sm text-gray-500 mt-1">{currentWord.english} = {currentWord.japanese}</p>
                </div>
                <button 
                    onClick={nextQuestion}
                    className="mt-4 w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-gray-900"
                    autoFocus // Allows hitting enter to proceed
                >
                    次へ
                </button>
            </div>
        )}
    </div>
  );
};
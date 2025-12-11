import React, { useState, useMemo } from 'react';
import { AppSection, QuizConfig, QuizType, SortOrder, ScrambleCategory, Word } from '../types';
import { WordList } from './WordList';
import { BookOpen, Shuffle, ListOrdered, BarChart2, Plus, X } from 'lucide-react';

interface DashboardProps {
  section: AppSection;
  words: Word[];
  setWords: (words: Word[]) => void;
  onStartQuiz: (config: QuizConfig) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ section, words, setWords, onStartQuiz }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'list'>('menu');
  const [scrambleTab, setScrambleTab] = useState<ScrambleCategory>(ScrambleCategory.USAGE);
  const [randomCount, setRandomCount] = useState(10);
  
  // Range State
  const [ranges, setRanges] = useState<{start: number, end: number}[]>([]);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  // Filter words by section AND ID ranges AND Scramble Category
  const filteredWords = useMemo(() => {
      let subset = words.filter(w => w.section === section);
      
      // Filter by Scramble category if we are in Scramble section
      if (section === AppSection.SCRAMBLE) {
          subset = subset.filter(w => w.scrambleCategory === scrambleTab);
      }
      
      // Filter by ID ranges
      if (ranges.length > 0) {
          subset = subset.filter(w => 
              ranges.some(r => w.id >= r.start && w.id <= r.end)
          );
      }
      return subset;
  }, [words, section, ranges, scrambleTab]);

  // Helper to add range
  const addRange = () => {
      const s = parseInt(tempStart);
      const e = parseInt(tempEnd);
      if (!isNaN(s) && !isNaN(e) && s <= e && s > 0) {
          setRanges([...ranges, { start: s, end: e }]);
          setTempStart('');
          setTempEnd('');
      }
  };

  const removeRange = (index: number) => {
      setRanges(ranges.filter((_, i) => i !== index));
  };

  const startQuiz = (configPartial: Partial<QuizConfig>) => {
      onStartQuiz({
          section,
          type: QuizType.MCQ_4_ENG_TO_JP, // Default fallback
          order: SortOrder.SEQUENTIAL, // Default fallback
          idRanges: ranges.length > 0 ? ranges : undefined,
          ...configPartial
      });
  };

  const startRandomLimitQuiz = () => {
      // Calculate actual available words based on current filters (section + ranges)
      const availableCount = filteredWords.length;
      const finalLimit = Math.min(randomCount, availableCount);

      startQuiz({
          type: QuizType.INPUT_JP_TO_ENG,
          order: SortOrder.RANDOM,
          limit: finalLimit
      });
  };

  const startReview = (reviewList: Word[]) => {
      startQuiz({
          type: QuizType.MCQ_4_ENG_TO_JP,
          order: SortOrder.RANDOM,
          onlyReview: true,
          scrambleCategory: section === AppSection.SCRAMBLE ? scrambleTab : undefined
      });
  };

  const ModeButton = ({ title, sub, onClick, colorClass }: any) => (
      <button 
        onClick={onClick}
        className={`p-4 rounded-xl shadow-sm border text-left hover:shadow-md transition flex flex-col justify-between h-32 ${colorClass || 'bg-white border-gray-200 hover:border-blue-300'}`}
      >
          <span className="font-bold text-lg text-gray-800">{title}</span>
          <span className="text-sm text-gray-500 flex items-center gap-1">{sub}</span>
      </button>
  );

  const SectionGrid = ({ category }: { category?: ScrambleCategory }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: English Display -> 4 Choice */}
        <div className="space-y-4">
            <h3 className="font-bold text-gray-500 border-b pb-2">英単語 → 4択</h3>
            <div className="grid grid-cols-1 gap-3">
                <ModeButton 
                    title="順番通り" 
                    sub={<><ListOrdered size={16}/> {ranges.length > 0 ? '範囲内すべて' : '全範囲'}</>}
                    // Scramble: "English -> 4 Choice" now changed to RANDOM (standard random choices)
                    onClick={() => startQuiz({ scrambleCategory: category, type: QuizType.MCQ_4_ENG_TO_JP, order: SortOrder.SEQUENTIAL })} 
                />
                <ModeButton 
                    title="ランダム出題" 
                    sub={<><Shuffle size={16}/> シャッフル</>}
                    // Scramble: "English -> 4 Choice" now changed to RANDOM
                    onClick={() => startQuiz({ scrambleCategory: category, type: QuizType.MCQ_4_ENG_TO_JP, order: SortOrder.RANDOM })} 
                />
                <ModeButton 
                    title="苦手な順" 
                    sub={<><BarChart2 size={16}/> 正答率順</>}
                    // Scramble: "English -> 4 Choice" now changed to RANDOM
                    onClick={() => startQuiz({ scrambleCategory: category, type: QuizType.MCQ_4_ENG_TO_JP, order: SortOrder.ACCURACY_ASC })} 
                />
            </div>
        </div>

        {/* Right Column: JP Display -> Input (or 4 choice for scramble) */}
        <div className="space-y-4">
            <h3 className="font-bold text-gray-500 border-b pb-2">{category ? '日本語 → 4択' : '日本語 → 英語入力'}</h3>
            <div className="grid grid-cols-1 gap-3">
                 <ModeButton 
                    title="順番通り" 
                    sub={<><ListOrdered size={16}/> {ranges.length > 0 ? '範囲内すべて' : '全範囲'}</>}
                    onClick={() => startQuiz({ scrambleCategory: category, type: category ? QuizType.MCQ_4_JP_TO_ENG : QuizType.INPUT_JP_TO_ENG, order: SortOrder.SEQUENTIAL })} 
                />
                <ModeButton 
                    title="ランダム出題" 
                    sub={<><Shuffle size={16}/> シャッフル</>}
                    onClick={() => startQuiz({ scrambleCategory: category, type: category ? QuizType.MCQ_4_JP_TO_ENG : QuizType.INPUT_JP_TO_ENG, order: SortOrder.RANDOM })} 
                />
                <ModeButton 
                    title="苦手な順" 
                    sub={<><BarChart2 size={16}/> 正答率順</>}
                    onClick={() => startQuiz({ scrambleCategory: category, type: category ? QuizType.MCQ_4_JP_TO_ENG : QuizType.INPUT_JP_TO_ENG, order: SortOrder.ACCURACY_ASC })} 
                />
            </div>
        </div>

        {/* Scramble Extra: Gap Fill (Fixed 4 Choice) */}
        {category && (
             <div className="col-span-1 md:col-span-2 space-y-4 mt-4">
                <h3 className="font-bold text-gray-500 border-b pb-2">空所補充 (英文穴埋め・4択)</h3>
                <div className="grid grid-cols-3 gap-3">
                    <ModeButton title="順番" sub="Sequential" onClick={() => startQuiz({ scrambleCategory: category, type: QuizType.GAP_FILL_MCQ, order: SortOrder.SEQUENTIAL })} />
                    <ModeButton title="ランダム" sub="Random" onClick={() => startQuiz({ scrambleCategory: category, type: QuizType.GAP_FILL_MCQ, order: SortOrder.RANDOM })} />
                    <ModeButton title="苦手順" sub="Accuracy" onClick={() => startQuiz({ scrambleCategory: category, type: QuizType.GAP_FILL_MCQ, order: SortOrder.ACCURACY_ASC })} />
                </div>
             </div>
        )}

        {/* Bottom: Random Limit (Only for LEAP/Target, generally) */}
        {!category && (
            <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t">
                 <h3 className="font-bold text-gray-500 mb-2">ランダムテスト (問題数指定)</h3>
                 <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
                    <span className="font-bold">問題数:</span>
                    <input 
                        type="number" 
                        value={randomCount} 
                        onChange={(e) => setRandomCount(Number(e.target.value))}
                        className="border p-2 rounded w-20 text-center bg-blue-50 text-black"
                        min="5" max="1000"
                    />
                    <span className="text-sm text-gray-500">
                        (対象: {filteredWords.length}語)
                    </span>
                    <button 
                        onClick={startRandomLimitQuiz}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow"
                    >
                        スタート
                    </button>
                 </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 pb-12">
      {/* ID Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-2">
            <h3 className="font-bold text-gray-700">学習範囲 (ID指定)</h3>
            <div className="text-sm text-gray-500">※未指定の場合は全範囲</div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center mb-3">
              <input 
                type="number" 
                placeholder="Start" 
                value={tempStart}
                onChange={e => setTempStart(e.target.value)}
                className="border p-2 rounded w-24 bg-blue-50 text-black"
              />
              <span className="text-gray-400">~</span>
              <input 
                type="number" 
                placeholder="End" 
                value={tempEnd}
                onChange={e => setTempEnd(e.target.value)}
                className="border p-2 rounded w-24 bg-blue-50 text-black"
              />
              <button 
                onClick={addRange}
                className="bg-gray-800 text-white p-2 rounded hover:bg-gray-700 flex items-center"
              >
                  <Plus size={16} /> 追加
              </button>
          </div>

          {ranges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {ranges.map((r, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          ID: {r.start} - {r.end}
                          <button onClick={() => removeRange(i)} className="hover:text-red-500"><X size={14}/></button>
                      </span>
                  ))}
                  <button onClick={() => setRanges([])} className="text-xs text-red-500 underline ml-2">全てクリア</button>
              </div>
          )}
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button 
            className={`py-3 px-6 font-bold border-b-2 transition ${activeTab === 'menu' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('menu')}
        >
            学習メニュー
        </button>
        <button 
            className={`py-3 px-6 font-bold border-b-2 transition ${activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('list')}
        >
            単語リスト
        </button>
      </div>

      {section === AppSection.SCRAMBLE && (
          <div className="flex flex-wrap gap-2 mb-6 p-2 bg-gray-100 rounded-lg">
              {Object.values(ScrambleCategory).map(cat => (
                  <button 
                      key={cat}
                      onClick={() => setScrambleTab(cat)}
                      className={`px-4 py-2 rounded-md font-medium text-sm transition ${scrambleTab === cat ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      {cat}
                  </button>
              ))}
          </div>
      )}

      {activeTab === 'list' ? (
        <WordList 
            words={filteredWords} 
            allWords={words}
            setWords={setWords} 
            sectionFilter={section} 
            onStartReview={startReview} 
        />
      ) : (
        <div>
            <SectionGrid category={section === AppSection.SCRAMBLE ? scrambleTab : undefined} />
        </div>
      )}
    </div>
  );
};
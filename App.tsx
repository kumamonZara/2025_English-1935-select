import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AppSection, QuizConfig, Word } from './types';
import { dataService } from './services/data';
import { Dashboard } from './components/Dashboard';
import { QuizSession } from './components/QuizSession';
import { Statistics } from './components/Statistics';
import { Book, PieChart, GraduationCap, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [words, setWords] = useState<Word[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);

  useEffect(() => {
    // Load data on mount
    const loadedWords = dataService.getWords();
    setWords(loadedWords);
  }, []);

  const handleStartQuiz = (config: QuizConfig) => {
    setQuizConfig(config);
  };

  const handleQuizExit = () => {
    setQuizConfig(null);
    // Reload words to update stats shown in Dashboard/List
    setWords(dataService.getWords());
  };

  const NavButton = ({ section, icon: Icon, label, color }: any) => (
      <button 
        onClick={() => { setCurrentSection(section); setQuizConfig(null); }}
        className={`flex-1 flex flex-col items-center justify-center p-4 transition duration-200 border-b-4 
            ${currentSection === section ? `bg-white ${color} border-${color.split('-')[1]}-500` : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-500'}
        `}
      >
          <Icon className={`mb-1 ${currentSection === section ? color.replace('bg-', 'text-').replace('-50', '-600') : ''}`} />
          <span className={`font-bold text-sm ${currentSection === section ? 'text-gray-800' : ''}`}>{label}</span>
      </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <h1 className="text-xl font-black italic tracking-tighter text-blue-900 flex items-center gap-2 cursor-pointer" onClick={() => setCurrentSection(AppSection.HOME)}>
                    <GraduationCap />
                    E-Mastery
                </h1>
                <button 
                    onClick={() => { setCurrentSection(AppSection.STATS); setQuizConfig(null); }}
                    className="flex items-center gap-2 text-sm font-bold bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200 transition"
                >
                    <PieChart size={16} />
                    統計データ
                </button>
            </div>
            
            {/* Main Nav (Only visible if not in quiz) */}
            {!quizConfig && (
                <div className="flex border-t">
                    <NavButton section={AppSection.LEAP} icon={Book} label="LEAP" color="bg-blue-50 text-blue-600" />
                    <NavButton section={AppSection.TARGET} icon={FileText} label="TARGET" color="bg-red-50 text-red-600" />
                    <NavButton section={AppSection.SCRAMBLE} icon={ShuffleIcon} label="SCRAMBLE" color="bg-green-50 text-green-600" />
                </div>
            )}
        </header>

        {/* Main Content */}
        <main className="container mx-auto mt-6">
            {quizConfig ? (
                <QuizSession 
                    allWords={words} 
                    config={quizConfig} 
                    onExit={handleQuizExit} 
                    updateGlobalWords={setWords}
                />
            ) : (
                <>
                    {currentSection === AppSection.HOME && (
                        <div className="text-center py-20 px-4">
                            <h2 className="text-4xl font-bold mb-6 text-gray-800">Welcome to E-Mastery</h2>
                            <p className="text-xl text-gray-500 mb-12">Select a course to begin your study session.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                                <HomeCard title="LEAP" desc="Core Vocabulary" color="bg-blue-600" onClick={() => setCurrentSection(AppSection.LEAP)} />
                                <HomeCard title="TARGET" desc="Exam Focus" color="bg-red-600" onClick={() => setCurrentSection(AppSection.TARGET)} />
                                <HomeCard title="SCRAMBLE" desc="Grammar & Idioms" color="bg-green-600" onClick={() => setCurrentSection(AppSection.SCRAMBLE)} />
                            </div>
                        </div>
                    )}

                    {(currentSection === AppSection.LEAP || currentSection === AppSection.TARGET || currentSection === AppSection.SCRAMBLE) && (
                        <Dashboard 
                            section={currentSection} 
                            words={words} 
                            setWords={setWords} 
                            onStartQuiz={handleStartQuiz} 
                        />
                    )}

                    {currentSection === AppSection.STATS && (
                        <Statistics />
                    )}
                </>
            )}
        </main>
    </div>
  );
};

const ShuffleIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l14.2-12.6c.8-1 2-1.7 3.3-1.7H22"/><path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l14.2 12.6c.8 1 2 1.7 3.3 1.7H22"/></svg>
);

const HomeCard = ({ title, desc, color, onClick }: any) => (
    <div onClick={onClick} className={`${color} text-white p-8 rounded-2xl shadow-lg cursor-pointer transform hover:-translate-y-2 transition duration-300`}>
        <h3 className="text-3xl font-bold mb-2">{title}</h3>
        <p className="opacity-80">{desc}</p>
    </div>
);

export default App;
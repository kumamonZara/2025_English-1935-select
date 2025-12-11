import React, { useState, useEffect } from 'react';
import { HistoryRecord, HistoryDetail } from '../types';
import { dataService } from '../services/data';
import { Download, ChevronRight, ArrowLeft } from 'lucide-react';

export const Statistics: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    setHistory(dataService.getHistory());
  }, []);

  const downloadCSV = (data: HistoryRecord[] | HistoryRecord, filename: string) => {
    const csvContent = dataService.exportCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedRecord) {
      return (
          <div className="p-4 bg-white rounded-lg shadow h-full">
              <button onClick={() => setSelectedRecord(null)} className="flex items-center text-black hover:text-gray-700 mb-4">
                  <ArrowLeft size={16} className="mr-1"/> 戻る
              </button>
              
              <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-black">{selectedRecord.modeDescription}</h2>
                    <p className="text-sm text-black">{new Date(selectedRecord.date).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => downloadCSV(selectedRecord, `detail_${selectedRecord.id}.csv`)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-200 text-black border border-green-300 rounded hover:bg-green-300"
                  >
                      <Download size={16}/> CSV出力
                  </button>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-gray-100 border-b text-black">
                              <th className="p-2">Q</th>
                              <th className="p-2">Your Answer</th>
                              <th className="p-2">Correct Answer</th>
                              <th className="p-2">Result</th>
                          </tr>
                      </thead>
                      <tbody>
                          {selectedRecord.details.map((d, i) => (
                              <tr key={i} className="border-b text-black">
                                  <td className="p-2">{d.question}</td>
                                  <td className="p-2 text-red-600">{d.userAnswer}</td>
                                  <td className="p-2 text-green-600">{d.correctAnswer}</td>
                                  <td className="p-2">{d.isCorrect ? '○' : '×'}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">学習履歴</h2>
            <button 
                onClick={() => downloadCSV(history, 'history_summary.csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-200 text-black border border-green-300 rounded hover:bg-green-300"
            >
                <Download size={16}/> 一覧をCSV出力
            </button>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b text-black">
                        <th className="p-3">日付</th>
                        <th className="p-3">機能</th>
                        <th className="p-3 text-center">問題数</th>
                        <th className="p-3 text-center">正答率</th>
                        <th className="p-3">詳細</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50 cursor-pointer text-black" onClick={() => setSelectedRecord(record)}>
                            <td className="p-3 text-sm">{new Date(record.date).toLocaleDateString()} <span className="text-black text-xs">{new Date(record.date).toLocaleTimeString()}</span></td>
                            <td className="p-3">
                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs mr-2">{record.section}</span>
                                <span className="text-sm">{record.modeDescription}</span>
                            </td>
                            <td className="p-3 text-center">{record.totalQuestions}</td>
                            <td className="p-3 text-center font-bold text-blue-600">
                                {((record.correctCount / record.totalQuestions) * 100).toFixed(0)}%
                            </td>
                            <td className="p-3 text-black">
                                <ChevronRight size={20} />
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-black">まだ履歴がありません</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};
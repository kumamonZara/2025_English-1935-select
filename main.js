
// main.js

// グローバル状態管理
const App = {
    mode: 'START',
    range: { start: 1, end: 100 },
    queue: [],
    currentIndex: 0,
    score: 0,
    mistakes: [],
    searchTerm: '',
    isWaiting: false,
    wordList: [],
    quizType: 'RANDOM'
};

// 予備データ（データ読み込み失敗時用）
const EMERGENCY_DATA = [
    {id:1,en:"agree",ja:"賛成する"},
    {id:2,en:"oppose",ja:"反対する"},
    {id:3,en:"advise",ja:"忠告する"},
    {id:4,en:"tip",ja:"助言"}
];

// --- 初期化処理 ---
window.initApp = function() {
    console.log("Initializing App...");
    try {
        // データの取得
        if (typeof window.WORD_LIST !== 'undefined' && Array.isArray(window.WORD_LIST) && window.WORD_LIST.length > 0) {
            App.wordList = window.WORD_LIST;
            console.log(`Loaded ${App.wordList.length} words.`);
        } else {
            console.warn('External data invalid. Using emergency fallback.');
            App.wordList = EMERGENCY_DATA;
        }

        // 範囲の初期設定
        App.range.end = Math.min(100, App.wordList.length);

        // 画面描画
        render();
        
        // ローディング画面を消去（念のため）
        const loading = document.getElementById('loading-area');
        if(loading) loading.classList.add('hidden');

    } catch (e) {
        console.error("Init Error:", e);
        alert("起動に失敗しました: " + e.message);
    }
};

// --- レンダリング ---
function render() {
    const app = document.getElementById('app');
    if (!app) return;

    updateHeader();

    let html = '';
    switch (App.mode) {
        case 'START': html = viewStart(); break;
        case 'LIST': html = viewList(); break;
        case 'QUIZ': html = viewQuiz(); break;
        case 'RESULT': html = viewResult(); break;
        default: html = viewStart();
    }
    
    // ローディング画面などを上書きして描画
    app.innerHTML = html;
    postRender();
}

function updateHeader() {
    // ヘッダーボタンの制御（DOMが存在する場合のみ）
    const backBtn = document.getElementById('header-back-btn');
    const progContainer = document.getElementById('progress-container');
    const progText = document.getElementById('progress-text');
    const progBar = document.getElementById('progress-bar');

    if (!backBtn) return;

    // リスナーの再設定のためのクローン
    const newBtn = backBtn.cloneNode(true);
    if(backBtn.parentNode) backBtn.parentNode.replaceChild(newBtn, backBtn);
    
    newBtn.onclick = () => {
        App.mode = 'START';
        App.searchTerm = '';
        render();
    };

    if (App.mode === 'START') {
        newBtn.classList.add('hidden');
        if (progContainer) progContainer.classList.add('hidden');
    } else {
        newBtn.classList.remove('hidden');
        if (App.mode === 'QUIZ') {
            if (progContainer) progContainer.classList.remove('hidden');
            const total = App.queue.length;
            const current = App.currentIndex + 1;
            if (progText) progText.textContent = `${current} / ${total}`;
            if (progBar) progBar.style.width = total > 0 ? `${(current / total) * 100}%` : '0%';
        } else {
            if (progContainer) progContainer.classList.add('hidden');
        }
    }
}

function postRender() {
    if (App.mode === 'LIST' && App.searchTerm) {
        const input = document.getElementById('search-input');
        if (input) {
            input.focus();
            const val = input.value;
            input.value = '';
            input.value = val;
        }
    }
    if (App.mode === 'QUIZ' && App.quizType === 'TYPING') {
        const input = document.getElementById('type-input');
        if (input) input.focus();
    }
}

// --- ビュー定義 ---

function viewStart() {
    const total = App.wordList.length;
    return `
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8 fade-in pt-16">
        <div class="text-center space-y-4 pt-4">
            <h1 class="text-4xl font-bold text-indigo-600 tracking-tight">LEAP 英単語</h1>
            <div class="inline-block px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold">
                収録単語数: ${total}
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-lg mx-auto">
            <h2 class="font-bold text-slate-700 mb-4 text-center flex items-center justify-center gap-2">
                <span>🎯</span> 学習範囲 (ID指定)
            </h2>
            <div class="flex items-center justify-center gap-4 mb-6">
                <input type="number" id="range-start" value="${App.range.start}" class="w-24 p-3 border-2 border-slate-200 rounded-xl text-center font-bold text-xl focus:border-indigo-500 outline-none" min="1" max="${total}">
                <span class="text-slate-400">~</span>
                <input type="number" id="range-end" value="${App.range.end}" class="w-24 p-3 border-2 border-slate-200 rounded-xl text-center font-bold text-xl focus:border-indigo-500 outline-none" min="1" max="${total}">
            </div>
            <div class="grid grid-cols-2 gap-2">
                <button onclick="setRange(1, Math.min(100, ${total}))" class="bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 border border-slate-200 transition">1-100 (Part 1)</button>
                <button onclick="setRange(1, ${total})" class="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 border border-indigo-100 transition">全範囲</button>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button onclick="startList()" class="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 text-left flex items-center gap-4 transition group">
                <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">📖</div>
                <div>
                    <div class="font-bold text-lg text-slate-800">単語リスト</div>
                    <div class="text-xs text-slate-500">検索・一覧確認</div>
                </div>
            </button>
            <button onclick="startQuiz('RANDOM')" class="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-400 text-left flex items-center gap-4 transition group">
                <div class="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">🎲</div>
                <div>
                    <div class="font-bold text-lg text-slate-800">ランダム出題</div>
                    <div class="text-xs text-slate-500">4択クイズ</div>
                </div>
            </button>
            <button onclick="startQuiz('ORDER')" class="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-green-400 text-left flex items-center gap-4 transition group">
                <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">🔢</div>
                <div>
                    <div class="font-bold text-lg text-slate-800">番号順出題</div>
                    <div class="text-xs text-slate-500">ID順にテスト</div>
                </div>
            </button>
            <button onclick="startQuiz('TYPING')" class="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-orange-400 text-left flex items-center gap-4 transition group">
                <div class="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">⌨️</div>
                <div>
                    <div class="font-bold text-lg text-slate-800">タイピング</div>
                    <div class="text-xs text-slate-500">スペル入力</div>
                </div>
            </button>
        </div>
    </div>`;
}

function viewList() {
    const list = App.wordList;
    const s = parseInt(App.range.start) || 1;
    const e = parseInt(App.range.end) || list.length;
    const term = App.searchTerm ? App.searchTerm.toLowerCase() : '';
    
    const filtered = list.filter(w => {
        const inRange = w.id >= s && w.id <= e;
        const matches = !term || w.en.toLowerCase().includes(term) || w.ja.includes(term) || w.id.toString().includes(term);
        return inRange && matches;
    });

    const displayList = filtered.slice(0, 100);

    let items = displayList.map(w => `
        <div class="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-start hover:border-indigo-300 transition">
            <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1 shadow-inner">${w.id}</div>
            <div class="flex-1">
                <div class="font-bold text-xl text-slate-800">${w.en}</div>
                <div class="text-slate-600 text-sm leading-relaxed">${w.ja}</div>
            </div>
            <button onclick="speak(${w.id})" class="text-slate-400 hover:text-indigo-500 p-2 transition bg-slate-50 rounded-full w-10 h-10 flex items-center justify-center">🔊</button>
        </div>
    `).join('');

    return `
    <div class="max-w-2xl mx-auto px-4 pb-10 pt-20">
        <div class="sticky top-16 bg-slate-50/95 backdrop-blur z-10 py-4 -mx-4 px-4 border-b border-slate-200 mb-6 shadow-sm">
            <div class="relative">
                <input type="text" id="search-input" value="${App.searchTerm}" placeholder="単語、意味、IDで検索..." class="w-full p-4 pl-12 rounded-2xl border-2 border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition" oninput="onSearch(this.value)">
                <span class="absolute left-4 top-4 text-slate-400 text-xl">🔍</span>
                ${App.searchTerm ? `<button onclick="onSearch('')" class="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✕</button>` : ''}
            </div>
            <div class="flex justify-between items-center mt-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <span>Range: ${s} - ${e}</span>
                <span>${filtered.length} Hits ${filtered.length > 100 ? '(Top 100)' : ''}</span>
            </div>
        </div>
        <div class="space-y-4">
            ${items || '<div class="text-center text-slate-400 py-20 bg-white rounded-2xl border border-dashed border-slate-300">条件に一致する単語がありません</div>'}
        </div>
    </div>`;
}

function viewQuiz() {
    const word = App.queue[App.currentIndex];
    if (!word) return '<div class="text-center p-8 mt-20 text-red-500 font-bold">エラー: 出題データがありません</div>';

    let interaction = '';
    if (App.quizType === 'TYPING') {
        interaction = `
        <div class="w-full max-w-md space-y-6">
            <div class="text-center">
                <div class="text-sm text-slate-400 mb-2 font-bold uppercase tracking-wider">Meaning</div>
                <div class="text-xl text-slate-700 font-bold bg-slate-100 p-4 rounded-xl border border-slate-200">${word.ja}</div>
            </div>
            <input type="text" id="type-input" class="w-full p-4 text-center text-2xl font-bold border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition shadow-sm" autocomplete="off" placeholder="Type Answer">
            <button onclick="checkTyping()" class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5 transition active:scale-95">回答する</button>
        </div>
        <script>
            setTimeout(() => {
                const el = document.getElementById('type-input');
                if(el) {
                    el.focus();
                    el.onkeydown = (e) => { if(e.key === 'Enter') checkTyping(); };
                }
            }, 50);
        </script>`;
    } else {
        // 4択生成
        const list = App.wordList;
        let choices = [word];
        let safetyCount = 0;
        while(choices.length < 4 && safetyCount < 200) {
            const r = list[Math.floor(Math.random() * list.length)];
            if (r && r.id !== word.id && !choices.some(c => c.id === r.id)) {
                choices.push(r);
            }
            safetyCount++;
        }
        while(choices.length < 4) choices.push({id: 99999+choices.length, en: '---', ja: '---'});
        choices.sort(() => Math.random() - 0.5);

        interaction = `<div class="w-full grid gap-3">
            ${choices.map((c, i) => `
                <button onclick="checkAnswer(${c.id === word.id}, ${word.id})" class="relative p-5 bg-white border-2 border-slate-100 rounded-2xl text-left hover:bg-indigo-50 hover:border-indigo-200 transition-all flex gap-4 items-center group shadow-sm hover:shadow-md active:scale-[0.98]">
                    <span class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors">${i+1}</span>
                    <span class="font-bold text-slate-700 text-base sm:text-lg group-hover:text-indigo-900">${c.ja}</span>
                </button>
            `).join('')}
        </div>`;
    }

    return `
    <div class="max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen -mt-10 slide-up">
        <div class="w-full bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 text-center mb-8 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
            <div class="text-xs font-black text-slate-300 mb-2 uppercase tracking-widest">Word ID: ${word.id}</div>
            <h2 class="text-5xl font-black text-slate-800 mb-6 tracking-tight">${word.en}</h2>
            <button onclick="speak(${word.id})" class="px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-sm font-bold hover:bg-slate-100 hover:text-indigo-500 transition flex items-center justify-center gap-2 mx-auto">
                <span>🔊</span> 発音を確認
            </button>
        </div>
        ${interaction}
    </div>`;
}

function viewResult() {
    const percent = App.queue.length > 0 ? Math.round((App.score / App.queue.length) * 100) : 0;
    return `
    <div class="max-w-xl mx-auto px-4 py-12 text-center space-y-8 fade-in pt-24">
        <div class="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent -z-10"></div>
            <h2 class="text-slate-400 font-bold mb-4 uppercase tracking-widest text-sm">Total Score</h2>
            <div class="text-7xl font-black text-indigo-600 mb-2 tracking-tighter">${percent}<span class="text-4xl text-indigo-300">%</span></div>
            <p class="text-slate-600 font-medium text-lg">正解: <span class="text-indigo-600 font-bold">${App.score}</span> / ${App.queue.length}</p>
            <div class="flex justify-center gap-4 mt-10">
                <button onclick="retry()" class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition hover:-translate-y-0.5">もう一度</button>
                <button onclick="App.mode='START';render()" class="flex-1 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition">ホームへ</button>
            </div>
        </div>
        ${App.mistakes.length ? `
        <div class="bg-white p-6 rounded-3xl border border-slate-200 text-left shadow-sm">
            <h3 class="font-bold text-red-500 mb-4 flex items-center gap-2">
                <span>⚠️</span> 間違えた単語 (${App.mistakes.length})
            </h3>
            <div class="divide-y divide-slate-100 max-h-64 overflow-y-auto -mx-2 px-2">
                ${App.mistakes.map(w => `
                    <div class="py-3 flex justify-between items-center">
                        <div>
                            <div class="font-bold text-slate-800">${w.en}</div>
                            <div class="text-xs text-slate-500">${w.ja}</div>
                        </div>
                        <button onclick="speak(${w.id})" class="text-slate-300 hover:text-indigo-500">🔊</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="reviewMistakes()" class="w-full mt-6 py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 hover:border-indigo-400 transition">
                間違えた単語のみ復習する
            </button>
        </div>` : ''}
    </div>`;
}

// --- アクション ---

window.setRange = (s, e) => {
    const sEl = document.getElementById('range-start');
    const eEl = document.getElementById('range-end');
    if(sEl) sEl.value = s;
    if(eEl) eEl.value = e;
};

window.onSearch = (val) => {
    App.searchTerm = val;
    render();
};

window.startList = () => {
    parseRange();
    App.mode = 'LIST';
    render();
};

window.startQuiz = (type) => {
    parseRange();
    const list = App.wordList;
    const s = parseInt(App.range.start);
    const e = parseInt(App.range.end);
    const targets = list.filter(w => w.id >= s && w.id <= e);
    
    if (!targets.length) {
        alert('指定された範囲に単語がありません。\n範囲を変更してください。');
        return;
    }

    let q = [...targets];
    if (type === 'RANDOM') q.sort(() => Math.random() - 0.5);
    else if (type === 'ORDER') q.sort((a,b) => a.id - b.id);
    // タイピングもランダムが基本だが、ORDERの場合はそのまま
    if (type === 'TYPING') q.sort(() => Math.random() - 0.5);

    App.queue = q;
    App.currentIndex = 0;
    App.score = 0;
    App.mistakes = [];
    App.quizType = type;
    App.mode = 'QUIZ';
    App.isWaiting = false;
    render();
};

window.checkAnswer = (isCorrect, id) => {
    if (App.isWaiting) return;
    App.isWaiting = true;
    
    const word = App.wordList.find(w => w.id === id);
    if (isCorrect) App.score++;
    else if (word) App.mistakes.push(word);

    showFeedback(isCorrect, word);

    setTimeout(() => {
        hideFeedback();
        App.isWaiting = false;
        nextStep();
    }, 1200);
};

window.checkTyping = () => {
    if (App.isWaiting) return;
    const input = document.getElementById('type-input');
    if(!input) return;
    
    const val = input.value.trim().toLowerCase();
    const word = App.queue[App.currentIndex];
    
    if (!val) return;
    
    const isCorrect = val === word.en.toLowerCase();
    window.checkAnswer(isCorrect, word.id);
};

window.retry = () => {
    if (App.quizType === 'RANDOM') App.queue.sort(() => Math.random() - 0.5);
    App.currentIndex = 0;
    App.score = 0;
    App.mistakes = [];
    App.mode = 'QUIZ';
    render();
};

window.reviewMistakes = () => {
    App.queue = [...App.mistakes];
    App.currentIndex = 0;
    App.score = 0;
    App.mistakes = [];
    App.quizType = 'ORDER'; // 復習は順番通りが見やすい
    App.mode = 'QUIZ';
    render();
};

window.speak = (id) => {
    const w = App.wordList.find(w => w.id === id);
    if (w) {
        const u = new SpeechSynthesisUtterance(w.en);
        u.lang = 'en-US';
        speechSynthesis.speak(u);
    }
};

function parseRange() {
    const s = document.getElementById('range-start');
    const e = document.getElementById('range-end');
    if (s && e) {
        App.range.start = parseInt(s.value) || 1;
        App.range.end = parseInt(e.value) || 100;
    }
}

function nextStep() {
    if (App.currentIndex < App.queue.length - 1) {
        App.currentIndex++;
        render();
    } else {
        App.mode = 'RESULT';
        render();
    }
}

function showFeedback(isCorrect, word) {
    const overlay = document.getElementById('feedback-overlay');
    const title = document.getElementById('feedback-title');
    const msg = document.getElementById('feedback-message');
    const content = document.getElementById('feedback-content');

    overlay.classList.remove('hidden', 'opacity-0');
    overlay.classList.add('opacity-100');

    if (isCorrect) {
        content.className = "p-8 rounded-3xl bg-green-50 border-4 border-green-400 text-center max-w-sm mx-4 shadow-2xl scale-110 transition";
        title.textContent = "Correct!";
        title.className = "text-5xl font-black text-green-500 mb-4 tracking-tighter";
        msg.innerHTML = `<div class="font-bold text-green-700">${word.ja}</div>`;
    } else {
        content.className = "p-8 rounded-3xl bg-red-50 border-4 border-red-400 text-center max-w-sm mx-4 shadow-2xl scale-110 transition";
        title.textContent = "Miss...";
        title.className = "text-5xl font-black text-red-500 mb-4 tracking-tighter";
        msg.innerHTML = `
            <div class="text-2xl font-bold text-slate-800 mb-1">${word.en}</div>
            <div class="text-sm text-slate-500">${word.ja}</div>
        `;
    }
}

function hideFeedback() {
    const overlay = document.getElementById('feedback-overlay');
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

// --- エントリーポイント ---
// DOMが準備できたら初期化を実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initApp);
} else {
    window.initApp();
}

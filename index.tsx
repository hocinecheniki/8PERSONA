
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types & Constants ---
type Axis = 'ORGANIZER' | 'LEADER' | 'INDEPENDENT' | 'CREATOR';
type Stage = 'LANDING' | 'AUTH_LOGIN' | 'AUTH_SIGNUP' | 'DASHBOARD' | 'QUIZ' | 'CALCULATING' | 'RESULT';

interface UserResult {
  id: string;
  date: string;
  type: string;
  subtitle: string;
  icon: string;
  aiAnalysis?: string;
}

interface UserAccount {
  username: string;
  email: string;
  password?: string;
  history: UserResult[];
}

const QUESTIONS = [
  { id: 1, text: "المال يمثل بالنسبة لي عنصر أمان واستقرار أساسي.", type: 'AXIS', category: 'ORGANIZER' },
  { id: 2, text: "أميل للتفكير الزائد قبل اتخاذ القرارات المهمة.", type: 'AXIS', category: 'ORGANIZER' },
  { id: 3, text: "أفضل البيئات المنظمة على البيئات العشوائية.", type: 'AXIS', category: 'ORGANIZER' },
  { id: 4, text: "يصعب علي تقبل تصرفات الآخرين إن خالفت قناعاتي.", type: 'AXIS', category: 'ORGANIZER' },
  { id: 5, text: "ألتزم بعادات يومية ثابتة.", type: 'AXIS', category: 'ORGANIZER' },
  { id: 6, text: "حساسية تجاه الضجيج ودرجة تحمله المنخفضة.", type: 'AXIS', category: 'ORGANIZER' },
  { id: 7, text: "إذا واجه شخص مشكلة، أبادر بمساعدته دون تردد.", type: 'AXIS', category: 'LEADER' },
  { id: 8, text: "أستطيع العمل تحت الضغط لفترات طويلة.", type: 'AXIS', category: 'LEADER' },
  { id: 9, text: "أفضل تحمل المسؤولية بنفسي بدل توزيعها.", type: 'AXIS', category: 'LEADER' },
  { id: 10, text: "لا أرتاح إلا عندما يكون القرار النهائي بيدي.", type: 'AXIS', category: 'LEADER' },
  { id: 11, text: "أعتبر تملك الأصول الثابتة هدفاً أساسياً.", type: 'AXIS', category: 'LEADER' },
  { id: 12, text: "مزاجي يتأثر بسرعة بالبيئة والمحيط.", type: 'AXIS', category: 'INDEPENDENT' },
  { id: 13, text: "أحب السفر أو تغيير المكان باستمرار.", type: 'AXIS', category: 'INDEPENDENT' },
  { id: 14, text: "أفضل المرونة على الاستقرار الوظيفي الطويل.", type: 'AXIS', category: 'INDEPENDENT' },
  { id: 15, text: "أعمل بشكل أفضل عندما أكون مستقلاً تماماً.", type: 'AXIS', category: 'INDEPENDENT' },
  { id: 16, text: "لدي ميول إبداعية أو أفكار غير تقليدية.", type: 'AXIS', category: 'CREATOR' },
  { id: 17, text: "عقلي نشط دائماً حتى في أوقات الراحة.", type: 'AXIS', category: 'CREATOR' },
  { id: 18, text: "أحتاج ساعات نوم أقل مع بقاء التركيز عالياً.", type: 'AXIS', category: 'CREATOR' },
  { id: 19, text: "أتنقل بين الانطواء والانفتاح حسب الظرف.", type: 'AXIS', category: 'CREATOR' },
  { id: 20, text: "أفكر كثيراً في الأسئلة العميقة أو الفلسفية.", type: 'AXIS', category: 'CREATOR' },
  { id: 21, text: "أفضل فهم الفكرة قبل تطبيقها.", type: 'DIMENSION', category: 'T' },
  { id: 22, text: "أستمتع بـ \"لماذا وكيف\".", type: 'DIMENSION', category: 'T' },
  { id: 23, text: "أبحث كثيراً قبل البدء.", type: 'DIMENSION', category: 'T' },
  { id: 24, text: "أرتاح للأفكار المجردة.", type: 'DIMENSION', category: 'T' },
  { id: 25, text: "أؤجل التنفيذ حتى تتضح الصورة.", type: 'DIMENSION', category: 'T' },
  { id: 26, text: "أتعلم بالتجربة المباشرة.", type: 'DIMENSION', category: 'P' },
  { id: 27, text: "أفضل الحلول البسيطة.", type: 'DIMENSION', category: 'P' },
  { id: 28, text: "لا أحتاج كل التفاصيل لأبدأ.", type: 'DIMENSION', category: 'P' },
  { id: 29, text: "أتحسن من خلال الخطأ.", type: 'DIMENSION', category: 'P' },
  { id: 30, text: "أشعر بالملل من التخطيط الطويل.", type: 'DIMENSION', category: 'P' },
];

const RESULTS_CONTENT: Record<string, any> = {
  'LEADER_T': { title: "القائد النظري", subtitle: "مهندس الرؤية", desc: "يركز على الصورة الكبيرة والمستقبل وعمق الاستراتيجيات.", icon: "🎯", axis: 'LEADER' },
  'LEADER_P': { title: "القائد العملي", subtitle: "قائد المعركة", desc: "يركز على النتائج الفورية، الحسم، وحل المشكلات اللوجستية المعقدة.", icon: "⚡", axis: 'LEADER' },
  'ORGANIZER_T': { title: "المنظم النظري", subtitle: "واضع الأنظمة", desc: "يستمتع بتصميم الهياكل، اللوائح، والمنطق خلف الترتيب.", icon: "📐", axis: 'ORGANIZER' },
  'ORGANIZER_P': { title: "المنظم العملي", subtitle: "ضابط الإيقاع", desc: "يهتم بالترتيب المادي، المواعيد النهائية، والانضباط العالي في التنفيذ.", icon: "⏱️", axis: 'ORGANIZER' },
  'INDEPENDENT_T': { title: "المتمرد النظري", subtitle: "الفيلسوف الحر", desc: "يتمرد على الأفكار السائدة ويعيش في تساؤلاته الوجودية والبحث عن الحقيقة.", icon: "🔮", axis: 'INDEPENDENT' },
  'INDEPENDENT_P': { title: "المتمرد العملي", subtitle: "المغامر", desc: "يترك الروتين ليؤسس مساره الخاص، يفضل التجربة والمخاطرة المحسوبة.", icon: "🧗", axis: 'INDEPENDENT' },
  'CREATOR_T': { title: "الغامض المبدع النظري", subtitle: "الحالم", desc: "إبداعه يكمن في الخيال المحض، الفنون التجريدية، والأفكار المعقدة.", icon: "🎨", axis: 'CREATOR' },
  'CREATOR_P': { title: "الغامض المبدع العملي", subtitle: "الحرفي المبتكر", desc: "إبداعه يظهر في بناء الأشياء، المنتج النهائي، والحلول التقنية المبتكرة.", icon: "🛠️", axis: 'CREATOR' },
};

const AVATAR_OPTIONS: Record<string, string[]> = {
  'LEADER': ["🎯", "👑", "🦁", "🏛️", "🏔️", "⚔️", "🦅"],
  'ORGANIZER': ["📐", "⏱️", "🧩", "⚖️", "💼", "📅", "🔒"],
  'INDEPENDENT': ["🔮", "🧗", "🏹", "🛰️", "🌊", "🐺", "🛸"],
  'CREATOR': ["🎨", "🛠️", "💡", "🎭", "🌌", "🧪", "🎹"],
};

const App = () => {
  const [stage, setStage] = useState<Stage>('LANDING');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const lastSavedQuizId = useRef<string | null>(null);

  // --- Persistence Logic ---
  useEffect(() => {
    const savedUser = localStorage.getItem('thmaniyat_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setStage('DASHBOARD');
    }
  }, []);

  const getAccounts = (): UserAccount[] => {
    const accounts = localStorage.getItem('thmaniyat_accounts');
    return accounts ? JSON.parse(accounts) : [];
  };

  const saveAccounts = (accounts: UserAccount[]) => {
    localStorage.setItem('thmaniyat_accounts', JSON.stringify(accounts));
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const accounts = getAccounts();
    if (accounts.find(a => a.email === authEmail)) {
      setAuthError('البريد الإلكتروني مسجل مسبقاً');
      return;
    }
    const newUser: UserAccount = {
      username: authName,
      email: authEmail,
      password: authPass,
      history: []
    };
    accounts.push(newUser);
    saveAccounts(accounts);
    setCurrentUser(newUser);
    localStorage.setItem('thmaniyat_session', JSON.stringify(newUser));
    setStage('DASHBOARD');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const accounts = getAccounts();
    const user = accounts.find(a => a.email === authEmail && a.password === authPass);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('thmaniyat_session', JSON.stringify(user));
      setStage('DASHBOARD');
    } else {
      setAuthError('بيانات الدخول غير صحيحة');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('thmaniyat_session');
    setStage('LANDING');
    setAuthEmail('');
    setAuthPass('');
    setAuthName('');
    setAnswers({});
    setQuizIndex(0);
  };

  const goHome = () => {
    if (currentUser) setStage('DASHBOARD');
    else setStage('LANDING');
  };

  // --- Quiz Logic ---
  const onAnswer = (val: number) => {
    const newAnswers = { ...answers, [QUESTIONS[quizIndex].id]: val };
    setAnswers(newAnswers);
    if (quizIndex < QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setStage('CALCULATING');
      setTimeout(() => setStage('RESULT'), 2500);
    }
  };

  const finalResult = useMemo(() => {
    if (stage !== 'RESULT' && stage !== 'CALCULATING') return null;
    const scores: Record<Axis, number> = { ORGANIZER: 0, LEADER: 0, INDEPENDENT: 0, CREATOR: 0 };
    let t = 0, p = 0;
    QUESTIONS.forEach(q => {
      const val = answers[q.id] || 0;
      if (q.type === 'AXIS') scores[q.category as Axis] += val;
      else if (q.category === 'T') t += val;
      else if (q.category === 'P') p += val;
    });
    const bestAxis = (Object.keys(scores) as Axis[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
    return RESULTS_CONTENT[`${bestAxis}_${t >= p ? 'T' : 'P'}`];
  }, [answers, stage]);

  // --- Auto Save to LocalStorage ---
  useEffect(() => {
    if (stage === 'RESULT' && finalResult && currentUser) {
      const quizId = `quiz_${Object.values(answers).join('_')}`;
      if (lastSavedQuizId.current === quizId) return;

      const newHistoryItem: UserResult = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('ar-EG'),
        type: finalResult.title,
        subtitle: finalResult.subtitle,
        icon: finalResult.icon
      };

      const updatedUser = { 
        ...currentUser, 
        history: [newHistoryItem, ...currentUser.history] 
      };

      setCurrentUser(updatedUser);
      lastSavedQuizId.current = quizId;
      localStorage.setItem('thmaniyat_session', JSON.stringify(updatedUser));

      const accounts = getAccounts();
      const userIdx = accounts.findIndex(a => a.email === currentUser.email);
      if (userIdx !== -1) {
        accounts[userIdx] = updatedUser;
        saveAccounts(accounts);
      }
    }
  }, [stage, finalResult, currentUser, answers]);

  const getAiDeepDive = async () => {
    if (!finalResult || !currentUser) return;
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `أهلاً، أنا المستخدم ${currentUser.username}. نتيجتي في اختبار "ثمانيات": ${finalResult.title} - ${finalResult.subtitle}.
      حلل الشخصية في 3 نقاط مركزة: نقاط القوة، بيئة العمل المثالية، والتحدي الأكبر. بأسلوب راقٍ ومختصر باللغة العربية.`;
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiResponse(res.text);
    } catch (e) {
      setAiResponse("حدث خطأ في جلب التحليل.");
    } finally {
      setLoadingAi(false);
    }
  };

  // --- Navigation Bar Component ---
  const Navbar = () => (
    <nav className="flex justify-between items-center px-10 py-8 relative z-50">
      <button 
        onClick={goHome} 
        className="text-3xl font-black text-slate-900 tracking-tighter hover:text-teal-600 transition-all transform hover:scale-105 active:scale-95"
      >
        ثمانيات
      </button>
      {stage === 'LANDING' && (
        <button onClick={() => setStage('AUTH_LOGIN')} className="text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-slate-900 transition-colors">تسجيل الدخول</button>
      )}
      {(stage === 'DASHBOARD' || stage === 'RESULT') && (
        <button onClick={logout} className="text-slate-400 hover:text-rose-500 font-bold text-sm flex items-center gap-2">
          <span>خروج</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      )}
    </nav>
  );

  // --- UI Layouts ---
  if (stage === 'LANDING') return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto py-12">
        <div className="w-20 h-1 bg-teal-600 mb-10 animate-slide-up stagger-1"></div>
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1] animate-slide-up stagger-2">
          اكتشف هويتك <br/> <span className="text-teal-600">العميقة</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-light max-w-2xl leading-relaxed mb-12 animate-slide-up stagger-3">
          نظام متطور يحلل تعقيدات شخصيتك عبر 8 أنماط فريدة. اكتشف جوهرك ومسارك المثالي بدقة مدعومة بالذكاء الاصطناعي.
        </p>
        <button 
          onClick={() => setStage('AUTH_SIGNUP')} 
          className="flawless-btn bg-slate-900 text-white px-12 py-5 rounded-full text-lg font-bold hover:shadow-[0_20px_50px_rgba(15,23,42,0.3)] animate-slide-up stagger-4"
        >
          ابدأ رحلتك مجاناً
        </button>
        <div className="mt-20 animate-float opacity-40 select-none pointer-events-none">
          <span className="text-8xl">🧩</span>
        </div>
      </main>
    </div>
  );

  if (stage === 'AUTH_LOGIN' || stage === 'AUTH_SIGNUP') {
    const isLogin = stage === 'AUTH_LOGIN';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <Navbar />
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-50 relative animate-scale-in">
          <button onClick={() => setStage('LANDING')} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors text-xl">✕</button>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">ثمانيات</h2>
            <p className="text-slate-400 text-sm">{isLogin ? 'سجل دخولك لمتابعة رحلتك' : 'أنشئ حساباً جديداً لنبدأ'}</p>
          </div>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <input required type="text" placeholder="الاسم الكامل" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50 transition-all focus:bg-white" />
            )}
            <input required type="email" placeholder="البريد الإلكتروني" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50 transition-all focus:bg-white" />
            <input required type="password" placeholder="كلمة المرور" value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50 transition-all focus:bg-white" />
            {authError && <p className="text-rose-500 text-xs text-center font-bold bg-rose-50 p-3 rounded-lg animate-pulse">{authError}</p>}
            <button type="submit" className="flawless-btn w-full bg-slate-900 text-white py-4 rounded-xl text-lg font-bold shadow-lg shadow-slate-200">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
            </button>
          </form>
          <div className="mt-8 text-center">
            <button onClick={() => setStage(isLogin ? 'AUTH_SIGNUP' : 'AUTH_LOGIN')} className="text-slate-400 text-sm hover:text-teal-600 transition-colors font-medium">{isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخولك'}</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'DASHBOARD') return (
    <div className="min-h-screen py-8">
      <Navbar />
      <div className="px-6 max-w-4xl mx-auto animate-slide-up py-12">
        <div className="flex justify-between items-center mb-16">
          <div className="text-right stagger-1 animate-slide-up">
            <h1 className="text-4xl font-black text-slate-900">أهلاً، {currentUser?.username}</h1>
            <p className="text-slate-400">مرحباً بك في عالمك الخاص.</p>
          </div>
          <button onClick={() => setStage('QUIZ')} className="bg-teal-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-teal-100 hover:scale-110 transition-transform active:scale-95">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group stagger-2 animate-slide-up">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-teal-600/20 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
            <div className="relative z-10">
              <h3 className="text-teal-400 font-bold uppercase text-xs tracking-widest mb-4">اكتشاف جديد</h3>
              <p className="text-3xl font-black mb-4">تحليل النمط المتطور</p>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">ابدأ اختباراً جديداً لتعميق فهمك لنفسك أو تتبع تطورك المهني والشخصي.</p>
            </div>
            <button onClick={() => { setStage('QUIZ'); setQuizIndex(0); setAnswers({}); setAiResponse(""); lastSavedQuizId.current = null; }} className="flawless-btn bg-white text-slate-900 px-8 py-4 rounded-full font-bold self-start mt-6 relative z-10 hover:shadow-xl">ابدأ الاختبار</button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col stagger-3 animate-slide-up">
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">آخر النتائج</h3>
            <div className="space-y-4 flex-grow overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {currentUser?.history.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl mb-4 block grayscale opacity-30">📭</span>
                  <p className="text-slate-300 italic">لا يوجد سجل حتى الآن.</p>
                </div>
              ) : currentUser?.history.map((item, idx) => (
                <div key={item.id} style={{animationDelay: `${idx * 0.1}s`}} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 hover:border-teal-100 hover:bg-teal-50/30 transition-all animate-slide-up">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="font-bold text-slate-900">{item.type}</p>
                    <p className="text-xs text-slate-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (stage === 'QUIZ') return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-xl">
        <div className="progress-pill mb-12 shadow-inner">
          <div className="progress-fill" style={{ width: `${((quizIndex + 1) / QUESTIONS.length) * 100}%` }}></div>
        </div>
        <div className="text-center mb-16 animate-slide-up">
          <span className="text-teal-600 font-bold text-sm mb-4 block tracking-[0.2em] uppercase">السؤال {quizIndex + 1}</span>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">{QUESTIONS[quizIndex].text}</h2>
        </div>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map((v, i) => (
            <button 
              key={v} 
              onClick={() => onAnswer(v)} 
              style={{animationDelay: `${i * 0.05}s`}}
              className="flawless-btn w-full p-6 rounded-2xl border-2 border-slate-100 bg-white text-right flex justify-between items-center hover:border-teal-600 hover:bg-teal-50/20 group animate-slide-up"
            >
              <span className="text-lg font-medium text-slate-700 group-hover:text-teal-700 transition-colors">
                {v === 5 ? 'ينطبق تماماً' : v === 1 ? 'أبداً' : v === 3 ? 'أحياناً' : v > 3 ? 'غالباً' : 'نادراً'}
              </span>
              <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-teal-600 group-hover:bg-teal-500 group-hover:scale-125 transition-all"></div>
            </button>
          ))}
        </div>
        <div className="mt-10 text-center">
            <button onClick={goHome} className="text-slate-300 text-sm hover:text-slate-500 transition-colors underline decoration-dotted">إلغاء الاختبار والعودة</button>
        </div>
      </div>
    </div>
  );

  if (stage === 'CALCULATING') return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-white">
      <div className="relative mb-12">
        <div className="w-24 h-24 border-4 border-teal-50 border-t-teal-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🧠</div>
      </div>
      <h2 className="text-3xl font-black text-slate-900 animate-pulse-soft mb-2">جاري فك الشفرة...</h2>
      <p className="text-slate-400">يتم الآن تحليل الأنماط ومقارنتها بقاعدة البيانات الذكية.</p>
    </div>
  );

  if (stage === 'RESULT' && finalResult) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="py-12 px-6 animate-slide-up max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-8xl p-10 bg-slate-50 inline-block rounded-[3rem] mb-8 shadow-2xl shadow-slate-100 animate-scale-in">
             <span className="inline-block animate-float">{selectedAvatar || finalResult.icon}</span>
          </div>
          <div className="flex justify-center flex-wrap gap-3 mb-10 animate-slide-up stagger-1">
            {AVATAR_OPTIONS[finalResult.axis].map(icon => (
              <button 
                key={icon} 
                onClick={() => setSelectedAvatar(icon)} 
                className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all transform hover:scale-110 active:scale-90 ${selectedAvatar === icon ? 'border-teal-600 bg-teal-50 shadow-md scale-110' : 'border-transparent bg-slate-50 opacity-60 hover:opacity-100'}`}
              >
                {icon}
              </button>
            ))}
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-2 animate-slide-up stagger-2">{finalResult.title}</h1>
          <p className="text-2xl text-slate-400 font-light mb-12 animate-slide-up stagger-3">{finalResult.subtitle}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="col-span-2 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-slide-up stagger-3">
            <h4 className="text-slate-900 font-bold text-xl mb-6 flex items-center gap-3">
               <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
               جوهر النمط
            </h4>
            <p className="text-slate-600 leading-relaxed text-lg font-light">{finalResult.desc}</p>
            <button 
                onClick={getAiDeepDive} 
                disabled={loadingAi} 
                className={`mt-10 w-full md:w-auto bg-teal-600 text-white px-10 py-5 rounded-full font-bold transition-all shadow-lg hover:shadow-teal-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3`}
            >
              {loadingAi ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري قراءة أعماقك...</span>
                </>
              ) : (
                <>
                  <span>✨ اكتشف التحليل الذكي للنمط</span>
                </>
              )}
            </button>
          </div>
          
          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl animate-slide-up stagger-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🔒</div>
            <p className="text-lg opacity-90 leading-relaxed relative z-10">تمت أرشفة هذه النتيجة في سجل هويتك السحابي بنجاح للرجوع إليها مستقبلاً.</p>
            <button onClick={() => setStage('DASHBOARD')} className="bg-white text-slate-900 w-full py-5 rounded-2xl font-black mt-10 hover:bg-slate-50 transition-colors shadow-xl relative z-10">العودة للوحة التحكم</button>
          </div>
        </div>

        {aiResponse && (
          <div className="bg-white border-4 border-teal-50 p-12 rounded-[4rem] shadow-2xl shadow-teal-50 mb-20 animate-scale-in relative">
            <div className="absolute -top-6 -right-6 text-5xl">✨</div>
            <h4 className="text-teal-600 font-black text-3xl mb-8 border-b-2 border-teal-50 pb-4 inline-block">الرؤية العميقة لثمانيات</h4>
            <div className="whitespace-pre-wrap text-slate-800 leading-loose text-xl font-light">{aiResponse}</div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

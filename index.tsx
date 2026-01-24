
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types & Constants ---
type Axis = 'ORGANIZER' | 'LEADER' | 'INDEPENDENT' | 'CREATOR';
type Dimension = 'T' | 'P';
type Stage = 'AUTH_LOGIN' | 'AUTH_SIGNUP' | 'DASHBOARD' | 'QUIZ' | 'CALCULATING' | 'RESULT';

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

interface Question {
  id: number;
  text: string;
  type: 'AXIS' | 'DIMENSION';
  category: Axis | Dimension;
}

const QUESTIONS: Question[] = [
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
  'LEADER_T': { title: "القائد النظري", subtitle: "مهندس الرؤية", desc: "يركز على الصورة الكبيرة والمستقبل.", icon: "🎯", color: "#0d9488", axis: 'LEADER' },
  'LEADER_P': { title: "القائد العملي", subtitle: "قائد المعركة", desc: "يركز على النتائج الفورية وحل المشكلات اللوجستية.", icon: "⚡", color: "#f59e0b", axis: 'LEADER' },
  'ORGANIZER_T': { title: "المنظم النظري", subtitle: "واضع الأنظمة", desc: "يستمتع بتصميم الهياكل واللوائح.", icon: "📐", color: "#2563eb", axis: 'ORGANIZER' },
  'ORGANIZER_P': { title: "المنظم العملي", subtitle: "ضابط الإيقاع", desc: "يهتم بالترتيب المادي والانضباط العالي.", icon: "⏱️", color: "#6366f1", axis: 'ORGANIZER' },
  'INDEPENDENT_T': { title: "المتمرد النظري", subtitle: "الفيلسوف الحر", desc: "يتمرد على الأفكار السائدة ويعيش في تساؤلاته.", icon: "🔮", color: "#7c3aed", axis: 'INDEPENDENT' },
  'INDEPENDENT_P': { title: "المتمرد العملي", subtitle: "المغامر", desc: "يترك الروتين ليؤسس عمله الخاص بطريقته.", icon: "🧗", color: "#db2777", axis: 'INDEPENDENT' },
  'CREATOR_T': { title: "الغامض المبدع النظري", subtitle: "الحالم", desc: "إبداعه في الخيال المحض والأفكار المعقدة.", icon: "🎨", color: "#1e1b4b", axis: 'CREATOR' },
  'CREATOR_P': { title: "الغامض المبدع العملي", subtitle: "الحرفي المبتكر", desc: "إبداعه يظهر في المنتج النهائي والحلول التقنية.", icon: "🛠️", color: "#059669", axis: 'CREATOR' },
};

const AVATAR_OPTIONS: Record<string, string[]> = {
  'LEADER': ["🎯", "👑", "🦁", "🏛️", "🏔️", "⚔️", "🦅"],
  'ORGANIZER': ["📐", "⏱️", "🧩", "⚖️", "💼", "📅", "🔒"],
  'INDEPENDENT': ["🔮", "🧗", "🏹", "🛰️", "🌊", "🐺", "🛸"],
  'CREATOR': ["🎨", "🛠️", "💡", "🎭", "🌌", "🧪", "🎹"],
};

// --- App Component ---
const App = () => {
  const [stage, setStage] = useState<Stage>('AUTH_LOGIN');
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

  // Load persistence logic
  useEffect(() => {
    const savedUser = localStorage.getItem('thmaniyat_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setStage('DASHBOARD');
    }
  }, []);

  const saveAccounts = (accounts: UserAccount[]) => {
    localStorage.setItem('thmaniyat_accounts', JSON.stringify(accounts));
  };

  const getAccounts = (): UserAccount[] => {
    const accounts = localStorage.getItem('thmaniyat_accounts');
    return accounts ? JSON.parse(accounts) : [];
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
    setStage('AUTH_LOGIN');
    setAuthEmail('');
    setAuthPass('');
    setAuthName('');
    setAnswers({});
    setQuizIndex(0);
  };

  const onAnswer = (val: number) => {
    const newAnswers = { ...answers, [QUESTIONS[quizIndex].id]: val };
    setAnswers(newAnswers);
    if (quizIndex < QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setStage('CALCULATING');
      setTimeout(finishQuiz, 2500);
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

  const finishQuiz = () => {
    setStage('RESULT');
  };

  useEffect(() => {
    if (stage === 'RESULT' && finalResult && currentUser) {
      const newHistoryItem: UserResult = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('ar-EG'),
        type: finalResult.title,
        subtitle: finalResult.subtitle,
        icon: finalResult.icon
      };
      
      const updatedUser = { ...currentUser, history: [newHistoryItem, ...currentUser.history] };
      setCurrentUser(updatedUser);
      localStorage.setItem('thmaniyat_session', JSON.stringify(updatedUser));
      
      // Update persistent accounts
      const accounts = getAccounts();
      const userIdx = accounts.findIndex(a => a.email === currentUser.email);
      if (userIdx !== -1) {
        accounts[userIdx] = updatedUser;
        saveAccounts(accounts);
      }
    }
  }, [stage]);

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
      setAiResponse("حدث خطأ في جلب التحليل، يرجى المحاولة لاحقاً.");
    } finally {
      setLoadingAi(false);
    }
  };

  // --- Render Auth Screens ---
  if (stage === 'AUTH_LOGIN' || stage === 'AUTH_SIGNUP') {
    const isLogin = stage === 'AUTH_LOGIN';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-slide-up">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2">ثمانيات</h1>
            <p className="text-slate-400 font-light italic text-sm">{isLogin ? 'سجل دخولك لمتابعة رحلتك' : 'أنشئ حساباً جديداً لنبدأ'}</p>
          </div>
          
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-right text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 mr-2">الاسم</label>
                <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50" />
              </div>
            )}
            <div>
              <label className="block text-right text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 mr-2">البريد الإلكتروني</label>
              <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50" />
            </div>
            <div>
              <label className="block text-right text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 mr-2">كلمة المرور</label>
              <input required type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50" />
            </div>
            
            {authError && <p className="text-rose-500 text-xs text-center font-bold">{authError}</p>}
            
            <button type="submit" className="flawless-btn w-full bg-slate-900 text-white py-4 rounded-xl text-lg font-bold hover:shadow-xl transition-all mt-4">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <button onClick={() => setStage(isLogin ? 'AUTH_SIGNUP' : 'AUTH_LOGIN')} className="text-slate-400 text-sm hover:text-teal-600 transition-colors">
              {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Dashboard ---
  if (stage === 'DASHBOARD') return (
    <div className="min-h-screen py-16 px-6 max-w-4xl mx-auto animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div className="text-right">
          <h1 className="text-5xl font-black text-slate-900 mb-2">أهلاً، {currentUser?.username}</h1>
          <p className="text-slate-400 italic">مستعد لاكتشاف أبعاد جديدة في شخصيتك؟</p>
        </div>
        <button onClick={logout} className="text-slate-400 hover:text-rose-500 font-bold transition-all text-sm uppercase tracking-widest">تسجيل الخروج</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Quiz Starter */}
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between items-start shadow-xl">
          <div className="mb-10">
            <h3 className="text-teal-400 font-bold uppercase text-xs tracking-widest mb-4">اختبار جديد</h3>
            <p className="text-3xl font-black leading-tight mb-4">هل تغيرت شخصيتك مؤخراً؟</p>
            <p className="opacity-60 text-sm">أعد إجراء الاختبار لتحصل على أحدث تحليلاتنا المعمقة.</p>
          </div>
          <button onClick={() => { setStage('QUIZ'); setQuizIndex(0); setAnswers({}); setAiResponse(""); }} className="flawless-btn bg-white text-slate-900 px-8 py-4 rounded-full font-bold">بدء الاختبار الآن</button>
        </div>

        {/* History */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">سجل نتائجك</h3>
          {currentUser?.history.length === 0 ? (
            <div className="flex-grow flex items-center justify-center text-slate-300 italic">لا يوجد سجل مسبق</div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {currentUser?.history.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 hover:border-teal-100 transition-all">
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex-grow">
                    <p className="font-bold text-slate-900">{item.type}</p>
                    <p className="text-xs text-slate-400">{item.date}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- Render Quiz ---
  if (stage === 'QUIZ') return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-slide-up">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setStage('DASHBOARD')} className="text-slate-400 hover:text-slate-900 transition-all text-xs font-bold uppercase tracking-widest">إنهاء</button>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">دقة التحليل: عالية</div>
        </div>
        <div className="progress-pill mb-12">
          <div className="progress-fill" style={{ width: `${((quizIndex + 1) / QUESTIONS.length) * 100}%` }}></div>
        </div>
        
        <div className="text-center mb-16">
          <span className="text-teal-600 font-bold text-sm tracking-widest uppercase mb-4 block">السؤال {quizIndex + 1}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{QUESTIONS[quizIndex].text}</h2>
        </div>

        <div className="space-y-4">
          {[
            { v: 5, t: "ينطبق تماماً" },
            { v: 4, t: "غالباً" },
            { v: 3, t: "أحياناً" },
            { v: 2, t: "نادراً" },
            { v: 1, t: "أبداً" }
          ].map((opt) => (
            <button key={opt.v} onClick={() => onAnswer(opt.v)} className="flawless-btn w-full p-6 rounded-2xl border-2 border-slate-100 bg-white text-right flex justify-between items-center hover:border-teal-600 group transition-all">
              <span className="text-lg font-medium text-slate-700 group-hover:text-teal-700">{opt.t}</span>
              <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-teal-500 group-hover:bg-teal-500 transition-all"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (stage === 'CALCULATING') return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-pulse text-center">
      <div className="w-20 h-20 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mb-8"></div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">جاري تحليل بياناتك...</h2>
      <p className="text-slate-500 font-light italic">نحن نربط الأبعاد ببعضها البعض لنصل للنتيجة الأدق.</p>
    </div>
  );

  // --- Render Result ---
  if (stage === 'RESULT' && finalResult) return (
    <div className="min-h-screen bg-white py-20 px-6 animate-slide-up">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="relative inline-block mb-8">
            <div className="text-8xl p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm animate-bounce">
              {selectedAvatar || finalResult.icon}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-2 rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {AVATAR_OPTIONS[finalResult.axis].map((icon) => (
              <button
                key={icon}
                onClick={() => setSelectedAvatar(icon)}
                className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl transition-all border-2 ${selectedAvatar === icon ? 'border-teal-600 bg-teal-50 scale-110' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
              >
                {icon}
              </button>
            ))}
          </div>

          <h3 className="text-teal-600 font-bold tracking-[0.2em] uppercase text-sm mb-2">{currentUser?.username}، هويتك هي:</h3>
          <h1 className="text-6xl font-black text-slate-900 mb-4">{finalResult.title}</h1>
          <p className="text-2xl text-slate-400 font-light">{finalResult.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="col-span-2 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
            <h4 className="text-slate-900 font-bold text-xl mb-4">وصف النمط</h4>
            <p className="text-slate-600 leading-relaxed text-lg">{finalResult.desc}</p>
            <div className="mt-8 pt-8 border-t border-slate-200">
               <button 
                onClick={getAiDeepDive} 
                disabled={loadingAi}
                className="bg-teal-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-teal-100 transition-all disabled:opacity-50"
               >
                 {loadingAi ? "جاري القراءة..." : "✨ احصل على تحليل الذكاء الاصطناعي"}
               </button>
            </div>
          </div>
          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between">
            <div>
              <h4 className="text-teal-400 font-bold mb-4 uppercase text-xs tracking-widest">تم حفظ النتيجة</h4>
              <p className="text-lg opacity-90 leading-snug">تمت إضافة هذه النتيجة إلى سجل حسابك بنجاح.</p>
            </div>
            <button onClick={() => setStage('DASHBOARD')} className="bg-white text-slate-900 w-full py-4 rounded-2xl font-bold mt-6">العودة للوحة التحكم</button>
          </div>
        </div>

        {aiResponse && (
          <div className="mb-20 animate-slide-up">
            <div className="bg-white border-2 border-teal-50 p-12 rounded-[3rem] shadow-sm">
              <h4 className="text-teal-600 font-black text-2xl mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-teal-600 text-white flex items-center justify-center rounded-lg text-sm">AI</span>
                الرؤية العميقة لثمانيات
              </h4>
              <div className="whitespace-pre-wrap text-slate-700 leading-loose text-lg font-light">
                {aiResponse}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

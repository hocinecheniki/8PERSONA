
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Client Initialization ---
const SUPABASE_URL = "https://tvcfajbhtqjqvlckpkfo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2ZhamJodHFqcXZsY2twa2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzE0MDYsImV4cCI6MjA4NTcwNzQwNn0.gOmdeoEXKctMiNgigXlwCxD7b-VJkbARrMzSj8ZhZQk";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Types & Constants ---
type Axis = 'ORGANIZER' | 'LEADER' | 'INDEPENDENT' | 'CREATOR';
type Dimension = 'T' | 'P';
type Stage = 'LANDING' | 'AUTH_LOGIN' | 'AUTH_SIGNUP' | 'DASHBOARD' | 'QUIZ' | 'CALCULATING' | 'RESULT';

interface UserResult {
  id: string;
  created_at: string;
  type: string;
  subtitle: string;
  icon: string;
  ai_analysis?: string;
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
  'LEADER_T': { title: "القائد النظري", subtitle: "مهندس الرؤية", desc: "يركز على الصورة الكبيرة والمستقبل.", icon: "🎯", axis: 'LEADER' },
  'LEADER_P': { title: "القائد العملي", subtitle: "قائد المعركة", desc: "يركز على النتائج الفورية وحل المشكلات اللوجستية.", icon: "⚡", axis: 'LEADER' },
  'ORGANIZER_T': { title: "المنظم النظري", subtitle: "واضع الأنظمة", desc: "يستمتع بتصميم الهياكل واللوائح.", icon: "📐", axis: 'ORGANIZER' },
  'ORGANIZER_P': { title: "المنظم العملي", subtitle: "ضابط الإيقاع", desc: "يهتم بالترتيب المادي والانضباط العالي.", icon: "⏱️", axis: 'ORGANIZER' },
  'INDEPENDENT_T': { title: "المتمرد النظري", subtitle: "الفيلسوف الحر", desc: "يتمرد على الأفكار السائدة ويعيش في تساؤلاته.", icon: "🔮", axis: 'INDEPENDENT' },
  'INDEPENDENT_P': { title: "المتمرد العملي", subtitle: "المغامر", desc: "يترك الروتين ليؤسس عمله الخاص بطريقته.", icon: "🧗", axis: 'INDEPENDENT' },
  'CREATOR_T': { title: "الغامض المبدع النظري", subtitle: "الحالم", desc: "إبداعه في الخيال المحض والأفكار المعقدة.", icon: "🎨", axis: 'CREATOR' },
  'CREATOR_P': { title: "الغامض المبدع العملي", subtitle: "الحرفي المبتكر", desc: "إبداعه يظهر في المنتج النهائي والحلول التقنية.", icon: "🛠️", axis: 'CREATOR' },
};

const AVATAR_OPTIONS: Record<string, string[]> = {
  'LEADER': ["🎯", "👑", "🦁", "🏛️", "🏔️", "⚔️", "🦅"],
  'ORGANIZER': ["📐", "⏱️", "🧩", "⚖️", "💼", "📅", "🔒"],
  'INDEPENDENT': ["🔮", "🧗", "🏹", "🛰️", "🌊", "🐺", "🛸"],
  'CREATOR': ["🎨", "🛠️", "💡", "🎭", "🌌", "🧪", "🎹"],
};

const App = () => {
  const [stage, setStage] = useState<Stage>('LANDING');
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<UserResult[]>([]);
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const lastSavedQuizId = useRef<string | null>(null);

  // --- Auth & Session Handling ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setStage('DASHBOARD');
        fetchHistory(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setStage('DASHBOARD');
        fetchHistory(session.user.id);
      } else {
        setStage('LANDING');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setHistory(data);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPass,
      options: { data: { full_name: authName } }
    });
    if (error) setAuthError(error.message);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPass
    });
    if (error) setAuthError(error.message);
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setHistory([]);
    setAnswers({});
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

  // --- Automatic Save to Supabase ---
  useEffect(() => {
    const saveResult = async () => {
      if (stage === 'RESULT' && finalResult && session) {
        const quizId = `quiz_${Object.values(answers).join('_')}`;
        if (lastSavedQuizId.current === quizId) return;

        const { data, error } = await supabase
          .from('results')
          .insert({
            user_id: session.user.id,
            type: finalResult.title,
            subtitle: finalResult.subtitle,
            icon: finalResult.icon,
            ai_analysis: aiResponse || null
          })
          .select();

        if (!error && data) {
          lastSavedQuizId.current = quizId;
          fetchHistory(session.user.id);
        }
      }
    };
    saveResult();
  }, [stage, finalResult, session, answers]);

  const getAiDeepDive = async () => {
    if (!finalResult || !session) return;
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `أهلاً، أنا المستخدم ${session.user.user_metadata.full_name || 'زائر'}. نتيجتي في اختبار "ثمانيات": ${finalResult.title} - ${finalResult.subtitle}.
      حلل الشخصية في 3 نقاط مركزة: نقاط القوة، بيئة العمل المثالية، والتحدي الأكبر. بأسلوب راقٍ ومختصر باللغة العربية.`;
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiResponse(res.text);
    } catch (e) {
      setAiResponse("حدث خطأ في جلب التحليل.");
    } finally {
      setLoadingAi(false);
    }
  };

  // --- UI Components ---
  if (stage === 'LANDING') return (
    <div className="min-h-screen flex flex-col animate-slide-up bg-white">
      <nav className="flex justify-between items-center px-10 py-8">
        <div className="text-2xl font-black text-slate-900 tracking-tighter">ثمانيات</div>
        <button onClick={() => setStage('AUTH_LOGIN')} className="text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-slate-900 transition-colors">تسجيل الدخول</button>
      </nav>
      <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto">
        <div className="w-20 h-1 bg-teal-600 mb-10"></div>
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">اكتشف هويتك <br/> <span className="text-teal-600">العميقة</span></h1>
        <p className="text-xl md:text-2xl text-slate-500 font-light max-w-2xl leading-relaxed mb-12">نظام متطور يحلل تعقيدات شخصيتك عبر 8 أنماط فريدة. اكتشف جوهرك ومسارك المثالي بدقة مدعومة بالذكاء الاصطناعي.</p>
        <button onClick={() => setStage('AUTH_SIGNUP')} className="flawless-btn bg-slate-900 text-white px-12 py-5 rounded-full text-lg font-bold hover:shadow-2xl">ابدأ رحلتك مجاناً</button>
      </main>
    </div>
  );

  if (stage === 'AUTH_LOGIN' || stage === 'AUTH_SIGNUP') {
    const isLogin = stage === 'AUTH_LOGIN';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-slide-up">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-50 relative">
          <button onClick={() => setStage('LANDING')} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900">✕</button>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2">ثمانيات</h1>
            <p className="text-slate-400 text-sm">{isLogin ? 'سجل دخولك لمتابعة رحلتك' : 'أنشئ حساباً جديداً لنبدأ'}</p>
          </div>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <input required type="text" placeholder="الاسم الكامل" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50" />
            )}
            <input required type="email" placeholder="البريد الإلكتروني" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50" />
            <input required type="password" placeholder="كلمة المرور" value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-slate-100 outline-none focus:border-teal-600 bg-slate-50" />
            {authError && <p className="text-rose-500 text-xs text-center font-bold">{authError}</p>}
            <button type="submit" disabled={loading} className="flawless-btn w-full bg-slate-900 text-white py-4 rounded-xl text-lg font-bold disabled:opacity-50">
              {loading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب')}
            </button>
          </form>
          <div className="mt-8 text-center">
            <button onClick={() => setStage(isLogin ? 'AUTH_SIGNUP' : 'AUTH_LOGIN')} className="text-slate-400 text-sm hover:text-teal-600">{isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخولك'}</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'DASHBOARD') return (
    <div className="min-h-screen py-16 px-6 max-w-4xl mx-auto animate-slide-up">
      <div className="flex justify-between items-center mb-16">
        <div className="text-right">
          <h1 className="text-4xl font-black text-slate-900">أهلاً، {session?.user.user_metadata.full_name || 'مستخدم ثمانيات'}</h1>
          <p className="text-slate-400">مرحباً بك في لوحة تحكمك الشخصية.</p>
        </div>
        <button onClick={logout} className="text-slate-400 hover:text-rose-500 font-bold text-sm">تسجيل الخروج</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-teal-400 font-bold uppercase text-xs tracking-widest mb-4">اختبار جديد</h3>
            <p className="text-3xl font-black mb-4">اكتشف نمطك اليوم</p>
          </div>
          <button onClick={() => { setStage('QUIZ'); setQuizIndex(0); setAnswers({}); setAiResponse(""); lastSavedQuizId.current = null; }} className="flawless-btn bg-white text-slate-900 px-8 py-4 rounded-full font-bold self-start mt-6">ابدأ الاختبار</button>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">آخر النتائج</h3>
          <div className="space-y-4 flex-grow overflow-y-auto max-h-[250px] pr-2">
            {history.length === 0 ? <p className="text-slate-300 italic">لا يوجد سجل حتى الآن.</p> : history.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="font-bold text-slate-900">{item.type}</p>
                  <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (stage === 'QUIZ') return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-slide-up">
      <div className="w-full max-w-xl">
        <div className="progress-pill mb-12">
          <div className="progress-fill" style={{ width: `${((quizIndex + 1) / QUESTIONS.length) * 100}%` }}></div>
        </div>
        <div className="text-center mb-16">
          <span className="text-teal-600 font-bold text-sm mb-4 block">السؤال {quizIndex + 1}</span>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">{QUESTIONS[quizIndex].text}</h2>
        </div>
        <div className="space-y-4">
          {[5, 4, 3, 2, 1].map(v => (
            <button key={v} onClick={() => onAnswer(v)} className="flawless-btn w-full p-6 rounded-2xl border-2 border-slate-100 bg-white text-right flex justify-between items-center hover:border-teal-600 group">
              <span className="text-lg font-medium text-slate-700 group-hover:text-teal-700">{v === 5 ? 'ينطبق تماماً' : v === 1 ? 'أبداً' : v === 3 ? 'أحياناً' : v > 3 ? 'غالباً' : 'نادراً'}</span>
              <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:bg-teal-500 transition-all"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (stage === 'CALCULATING') return (
    <div className="flex flex-col items-center justify-center min-h-screen animate-pulse text-center">
      <div className="w-20 h-20 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mb-8"></div>
      <h2 className="text-2xl font-bold">جاري تحليل بياناتك...</h2>
    </div>
  );

  if (stage === 'RESULT' && finalResult) return (
    <div className="min-h-screen bg-white py-20 px-6 animate-slide-up">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-8xl p-8 bg-slate-50 inline-block rounded-[2.5rem] mb-8 shadow-sm">{selectedAvatar || finalResult.icon}</div>
          <div className="flex justify-center gap-3 mb-10">
            {AVATAR_OPTIONS[finalResult.axis].map(icon => (
              <button key={icon} onClick={() => setSelectedAvatar(icon)} className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 ${selectedAvatar === icon ? 'border-teal-600 bg-teal-50' : 'border-transparent bg-slate-50'}`}>{icon}</button>
            ))}
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-2">{finalResult.title}</h1>
          <p className="text-2xl text-slate-400 font-light mb-12">{finalResult.subtitle}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="col-span-2 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
            <h4 className="text-slate-900 font-bold text-xl mb-4">وصف النمط</h4>
            <p className="text-slate-600 leading-relaxed text-lg">{finalResult.desc}</p>
            <button onClick={getAiDeepDive} disabled={loadingAi} className="mt-8 bg-teal-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all disabled:opacity-50">
              {loadingAi ? "جاري التحليل..." : "✨ احصل على تحليل الذكاء الاصطناعي"}
            </button>
          </div>
          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between">
            <p className="text-lg opacity-90">تم حفظ النتيجة في سجل حسابك السحابي بنجاح.</p>
            <button onClick={() => setStage('DASHBOARD')} className="bg-white text-slate-900 w-full py-4 rounded-2xl font-bold mt-6">العودة للوحة التحكم</button>
          </div>
        </div>
        {aiResponse && (
          <div className="bg-white border-2 border-teal-50 p-12 rounded-[3rem] shadow-sm mb-20">
            <h4 className="text-teal-600 font-black text-2xl mb-6">الرؤية العميقة لثمانيات</h4>
            <div className="whitespace-pre-wrap text-slate-700 leading-loose text-lg font-light">{aiResponse}</div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

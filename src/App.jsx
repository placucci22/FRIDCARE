import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Dumbbell, Calendar, MessageSquare, User, Activity,
  ChevronRight, Plus, Clock, Check, X, FileText,
  Settings, LogOut, TrendingUp, Users, Play, Pause,
  ChevronDown, Search, Upload, Lock, Phone, Mail, ShieldAlert,
  ToggleLeft, Menu, ArrowLeft
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithCustomToken, signInAnonymously,
  onAuthStateChanged, signOut, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, updateProfile
} from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDoc,
  onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where
} from 'firebase/firestore';

// --- Firebase Initialization ---
// Safe initialization for local dev
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "demo", authDomain: "demo", projectId: "demo"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'health-hub-v1';

// --- Configuration ---
const BYPASS_AUTH = true; // Set to false to enable real Login page

// --- Design System Constants (Enhanced for Personality) ---
const COLORS = {
  bg: 'bg-slate-50',
  primaryGradient: 'bg-gradient-to-r from-indigo-600 to-blue-500',
  primaryHover: 'hover:opacity-90',
  textMain: 'text-slate-900',
  textSub: 'text-slate-500',
  card: 'bg-white',
  border: 'border-slate-200',
  accent: 'text-indigo-600'
};

const STYLES = {
  card: `${COLORS.card} rounded-3xl shadow-lg shadow-slate-200/50 border ${COLORS.border} overflow-hidden transition-all hover:shadow-xl`,
  cardPadding: 'p-4 md:p-6',
  btnPrimary: `${COLORS.primaryGradient} ${COLORS.primaryHover} text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-indigo-200 active:scale-95`,
  btnSecondary: `bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 font-bold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95`,
  input: `w-full px-5 py-3 rounded-xl border ${COLORS.border} focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white font-medium`,
  label: `block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide`,
  h1: `text-2xl md:text-3xl font-extrabold ${COLORS.textMain} tracking-tight`,
  h2: `text-lg md:text-xl font-bold ${COLORS.textMain}`,
};

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDate = (date) => new Date(date?.seconds * 1000 || Date.now()).toLocaleDateString('pt-BR');

// --- Mock Data for Bypass Mode ---
const MOCK_USERS = {
  patient: {
    uid: 'mock-patient-1',
    name: 'Dev Patient',
    email: 'dev@passenger.com',
    role: 'patient',
    plan: 'free',
    status: 'active'
  },
  patient2: {
    uid: 'mock-patient-2',
    name: 'Ana Test',
    email: 'ana@test.com',
    role: 'patient',
    plan: 'premium',
    status: 'active'
  },
  patient3: {
    uid: 'mock-patient-3',
    name: 'Carlos Demo',
    email: 'carlos@demo.com',
    role: 'patient',
    plan: 'basic',
    status: 'inactive'
  },
  professional: {
    uid: 'mock-pro-1',
    name: 'Dev Coach',
    email: 'dev@coach.com',
    role: 'professional',
    plan: 'professional_tier',
    status: 'active'
  },
  admin: {
    uid: 'mock-admin-1',
    name: 'Admin User',
    email: 'admin@fridman.com',
    role: 'admin',
    plan: 'admin_tier',
    status: 'active'
  }
};

const SAMPLE_WORKOUT = {
  id: 'sample-plan-001',
  title: 'Hypertrophy – Phase 1',
  createdBy: 'mock-pro-1',
  createdAt: { seconds: Date.now() / 1000 },
  days: [
    {
      id: 'day-1',
      title: 'Day A – Pull & Back',
      exercises: [
        { name: 'Lat Pulldown (Reverse Grip)', sets: [{ reps: 12, weight: 60 }, { reps: 10, weight: 65 }, { reps: 8, weight: 70 }] },
        { name: 'Seated Cable Row', sets: [{ reps: 12, weight: 55 }, { reps: 10, weight: 60 }, { reps: 10, weight: 60 }] }
      ]
    },
    {
      id: 'day-2',
      title: 'Day B – Push & Chest',
      exercises: [
        { name: 'Dumbbell Bench Press', sets: [{ reps: 10, weight: 26 }, { reps: 8, weight: 28 }, { reps: 8, weight: 28 }] },
        { name: 'Lateral Raise', sets: [{ reps: 15, weight: 8 }, { reps: 15, weight: 8 }, { reps: 15, weight: 8 }] }
      ]
    }
  ]
};

const SAMPLE_DIET = {
  id: 'sample-diet-001',
  title: 'Sample Cutting Diet – 2300 kcal',
  calories: 2300,
  meals: [
    { time: '07:30', name: 'Breakfast', items: ['80g oats', '200ml skim milk', '1 banana', '20g peanut butter'] },
    { time: '12:30', name: 'Lunch', items: ['150g grilled chicken breast', '150g white rice', '100g mixed vegetables', '1 tbsp olive oil'] },
    { time: '16:30', name: 'Afternoon Snack', items: ['1 yogurt (low fat)', '30g nuts'] },
    { time: '18:30', name: 'Pre-workout', items: ['1 banana', '1 scoop whey protein'] },
    { time: '21:00', name: 'Dinner', items: ['150g lean ground beef or fish', '150g sweet potato', 'Salad with olive oil'] }
  ]
};

// --- Reusable Components ---
const Avatar = ({ name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg'
  };
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div className={`rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-indigo-200 flex-shrink-0 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {initial}
    </div>
  );
};

// --- Role Switcher ---
const DevRoleSwitcher = ({ onSwitch, currentRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className={`bg-white p-2 rounded-xl shadow-xl mb-2 flex flex-col gap-1 ${isOpen ? 'block' : 'hidden'}`}>
        {Object.values(MOCK_USERS).map(u => (
          <button
            key={u.role}
            onClick={() => { onSwitch(u); setIsOpen(false); }}
            className="px-4 py-2 text-left hover:bg-slate-100 rounded text-sm font-bold text-slate-700"
          >
            {u.name} ({u.role})
          </button>
        ))}
      </div>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-slate-900 text-white p-3 rounded-full shadow-lg">
        <Settings size={20} />
      </button>
    </div>
  );
};

// --- Debug Overlay ---
const DebugOverlay = ({ user, role, location }) => (
  <div className="fixed top-0 right-0 z-[9999] bg-black/80 text-green-400 p-2 text-[10px] font-mono pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
    <div>ROLE: {role}</div>
    <div>USER: {user ? `${user.name} (${user.uid})` : 'NULL'}</div>
    <div>PATH: {location.pathname}</div>
  </div>
);

// --- Components ---

// 1. Authentication & Onboarding
const AuthScreen = ({ onLogin, isBypass = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBypass) return;
    setError('');
    setLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        const userData = {
          uid: userCredential.user.uid,
          name,
          email,
          role,
          plan: role === 'patient' ? 'free' : (role === 'admin' ? 'admin_tier' : 'professional_tier'),
          status: role === 'professional' ? 'pending' : 'active',
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userCredential.user.uid), userData);
      }
    } catch (err) {
      let msg = "Ocorreu um erro.";
      if (err.message.includes("auth/wrong-password")) msg = "Senha incorreta.";
      if (err.message.includes("auth/user-not-found")) msg = "Usuário não encontrado.";
      if (err.message.includes("auth/email-already-in-use")) msg = "Este email já está em uso.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className={`${STYLES.card} w-full max-w-md p-6 md:p-10 border-t-8 border-t-indigo-600`}>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-5 text-white shadow-lg shadow-indigo-300 transform -rotate-6">
            <Activity size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fridman Care</h1>
          <p className="text-slate-500 mt-2 font-medium">Excelência em Saúde e Performance</p>
        </div>

        {isBypass ? (
          <div className="space-y-4 mb-8">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center mb-6">
              <p className="text-indigo-800 font-bold mb-1">Modo de Desenvolvimento</p>
              <p className="text-indigo-600 text-xs">Acesso rápido sem senha apenas para testes.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {Object.values(MOCK_USERS).map(u => (
                <button
                  key={u.role}
                  onClick={() => onLogin(u)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 transition-colors flex items-center justify-between px-6"
                >
                  <span>{u.name}</span>
                  <span className="text-xs uppercase bg-slate-200 text-slate-600 px-2 py-1 rounded">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className={STYLES.label}>Nome Completo</label>
                <input required type="text" className={STYLES.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ana Silva" />
              </div>
            )}
            <div>
              <label className={STYLES.label}>Email</label>
              <input required type="email" className={STYLES.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            </div>
            <div>
              <label className={STYLES.label}>Senha</label>
              <input required type="password" className={STYLES.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <label className={STYLES.label}>Eu sou:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['patient', 'professional', 'admin'].map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)} className={`p-3 rounded-xl border-2 text-center transition-all font-bold text-sm ${role === r ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{r === 'patient' ? 'Paciente' : r === 'professional' ? 'Prof' : 'Admin'}</button>
                  ))}
                </div>
              </div>
            )}
            {error && <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className={`${STYLES.btnPrimary} w-full mt-4 text-lg`}>
              {loading ? 'Processando...' : (isLogin ? 'Entrar no Sistema' : 'Criar Conta')}
            </button>
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                {isLogin ? "Novo na Fridman Care? Crie sua conta" : "Já tem conta? Faça login"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Main Logic ---
function HealthHubContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data States
  const [allUsers, setAllUsers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [myLogs, setMyLogs] = useState([]);

  // Navigation
  const navigate = useNavigate();
  const location = useLocation();

  const switchRole = (targetUser) => {
    console.log("Switching Role To:", targetUser);
    setUser(targetUser);

    // Force Navigation based on Role - Critical for the fix
    if (targetUser.role === 'professional') {
      navigate('/pro/dashboard');
    } else if (targetUser.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/patient/home');
    }
  };

  useEffect(() => {
    const init = async () => {
      if (BYPASS_AUTH) {
        setAllUsers(Object.values(MOCK_USERS));
        setWorkouts([SAMPLE_WORKOUT]);
        setAppointments([]);
        setMyLogs([]);
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

  if (!user) return <AuthScreen onLogin={switchRole} isBypass={BYPASS_AUTH} />;

  return (
    <>
      {BYPASS_AUTH && <DebugOverlay user={user} role={user.role} location={location} />}
      {BYPASS_AUTH && <DevRoleSwitcher onSwitch={switchRole} currentRole={user.role} />}

      <Routes>
        <Route path="/patient/*" element={user.role === 'patient' ? <PatientView user={user} allUsers={allUsers} workouts={workouts} myLogs={myLogs} setMyLogs={setMyLogs} /> : <Navigate to="/" />} />
        <Route path="/pro/*" element={user.role === 'professional' ? <ProfessionalView user={user} allUsers={allUsers} workouts={workouts} appointments={appointments} setAppointments={setAppointments} myLogs={myLogs} /> : <Navigate to="/" />} />
        <Route path="/admin/*" element={user.role === 'admin' ? <AdminView user={user} allUsers={allUsers} workouts={workouts} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to={user.role === 'professional' ? '/pro/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/patient/home'} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <HealthHubContent />
    </BrowserRouter>
  );
}

// --- VIEWS ---

// 2. Active Workout
const ActiveWorkout = ({ workout, onClose, onFinish }) => {
  const [startTime] = useState(Date.now());
  const [duration, setDuration] = useState(0);
  const [exercises, setExercises] = useState(
    workout.days[0].exercises.map(ex => ({ // Assuming workout.days[0] for simplicity, adjust if workout structure is different
      ...ex,
      sets: ex.sets.map((s, i) => ({
        id: i,
        reps: s.reps,
        weight: s.weight,
        completed: false,
        type: 'normal'
      }))
    }))
  );
  const [restTimer, setRestTimer] = useState(null);
  const [showRest, setShowRest] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);


  useEffect(() => {
    let interval;
    if (restTimer > 0) {
      interval = setInterval(() => setRestTimer(t => t - 1), 1000);
    } else if (restTimer === 0) {
      setShowRest(false);
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const toggleSet = (exIndex, setIndex) => {
    const newEx = [...exercises];
    const set = newEx[exIndex].sets[setIndex];
    set.completed = !set.completed;
    setExercises(newEx);

    if (set.completed) {
      setRestTimer(60);
      setShowRest(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const finishSession = () => {
    const logData = {
      workoutId: workout.id,
      title: workout.title,
      duration,
      date: serverTimestamp(),
      exercises: exercises.map(e => ({
        name: e.name,
        sets: e.sets.filter(s => s.completed)
      })),
      totalVolume: exercises.reduce((acc, ex) =>
        acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0)
        , 0)
    };
    onFinish(logData);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 md:px-6 py-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronDown className="text-slate-600" />
        </button>
        <div className="text-center">
          <h2 className="font-extrabold text-slate-900 text-base md:text-lg">{workout.title}</h2>
          <div className="flex items-center justify-center gap-2 text-indigo-600 font-mono font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full mt-1">
            <Clock size={14} /> {formatTime(duration)}
          </div>
        </div>
        <button
          onClick={finishSession}
          className="bg-indigo-600 text-white px-4 md:px-5 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
        >
          Finalizar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 pb-32 p-4 space-y-4">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl shadow-inner flex-shrink-0">
                {ex.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{ex.name}</h3>
                <p className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-1 rounded mt-1">Descanso: 60s</p>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Carga</div>
              <div className="col-span-3">Reps</div>
              <div className="col-span-3">Status</div>
            </div>

            <div className="space-y-2">
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className={`grid grid-cols-10 gap-2 md:gap-3 items-center transition-all ${set.completed ? 'opacity-40' : ''}`}>
                  <div className="col-span-1 flex justify-center">
                    <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                      {setIdx + 1}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-lg p-2 text-center font-mono font-bold text-slate-700 outline-none transition-colors"
                      defaultValue={set.weight}
                      onBlur={(e) => {
                        const newEx = [...exercises];
                        newEx[exIdx].sets[setIdx].weight = Number(e.target.value);
                        setExercises(newEx);
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-lg p-2 text-center font-mono font-bold text-slate-700 outline-none transition-colors"
                      defaultValue={set.reps}
                      onBlur={(e) => {
                        const newEx = [...exercises];
                        newEx[exIdx].sets[setIdx].reps = Number(e.target.value);
                        setExercises(newEx);
                      }}
                    />
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <button
                      onClick={() => toggleSet(exIdx, setIdx)}
                      className={`w-full h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${set.completed ? 'bg-green-500 text-white shadow-green-200 scale-95' : 'bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600'}`}
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showRest && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-10 border border-slate-700">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Descansando</span>
            <div className="text-3xl font-mono font-bold text-indigo-400">{formatTime(restTimer)}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRestTimer(t => t + 30)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors">+30s</button>
            <button onClick={() => { setShowRest(false); setRestTimer(null); }} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors">Pular</button>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Chat System
const ChatSystem = ({ currentUser, targetId, users, onSchedule }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !targetId) return;
    const chatId = [currentUser.uid, targetId].sort().join('_');
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'messages', chatId, 'logs'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.log("Chat error (expected if no access):", err));
    return () => unsub();
  }, [currentUser, targetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e && e.preventDefault();
    if (!newMessage.trim()) return;
    const chatId = [currentUser.uid, targetId].sort().join('_');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages', chatId, 'logs'), {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: serverTimestamp()
    });
    setNewMessage('');
  };

  const targetUser = users.find(u => u.uid === targetId);

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    if (action === 'schedule') {
      if (onSchedule) onSchedule(targetId);
      else alert("Agendamento não disponível nesta visualização.");
    } else if (action === 'diet') {
      alert(`Enviar dieta PDF para ${targetUser.name} (Funcionalidade simulada)`);
      // In real app, this would trigger the upload modal
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
      <div className="bg-white p-4 border-b flex items-center gap-3 shadow-sm z-10">
        <Avatar
          name={targetUser?.name}
          size="lg"
          className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-none shadow-md"
        />
        <div>
          <h3 className="font-bold text-slate-900">{targetUser?.name || 'Usuário'}</h3>
          <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm font-medium ${msg.senderId === currentUser.uid
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-3 items-center relative z-20">
        {/* Quick Actions Menu */}
        <div className="relative">
          {showQuickActions && (
            <div className="absolute bottom-12 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
              <button type="button" onClick={() => handleQuickAction('schedule')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors">
                <Calendar size={16} /> Agendar
              </button>
              <button type="button" onClick={() => handleQuickAction('diet')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors border-t border-slate-50">
                <Upload size={16} /> Enviar Dieta
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`p-3 rounded-full transition-all ${showQuickActions ? 'bg-indigo-100 text-indigo-600 rotate-45' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        <input
          type="text"
          className="flex-1 bg-slate-100 border-0 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-transform active:scale-90">
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};

// --- ROLE TOGGLE (For Development) ---
// This component is now replaced by the DevRoleSwitcher above.

// --- MAIN APP COMPONENT ---
// This component is now replaced by HealthHubContent and App above.

// 3. Appointment Modal
const AppointmentModal = ({ isOpen, onClose, onSave, users, initialData }) => {
  const [patientId, setPatientId] = useState(initialData?.patientId || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [type, setType] = useState(initialData?.type || 'Consulta');

  useEffect(() => {
    if (isOpen) {
      setPatientId(initialData?.patientId || '');
      // If no date provided, default to today or tomorrow? Keep empty for now.
      setDate(initialData?.date || new Date().toISOString().split('T')[0]);
      setTime(initialData?.time || '10:00');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: generateId(),
      patientId,
      date,
      time,
      type,
      status: 'scheduled'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20} /> Agendar Consulta</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={STYLES.label}>Paciente</label>
            <select required className={STYLES.input} value={patientId} onChange={e => setPatientId(e.target.value)}>
              <option value="">Selecione um paciente</option>
              {users.filter(u => u.role === 'patient').map(u => (
                <option key={u.uid} value={u.uid}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={STYLES.label}>Data</label>
              <input required type="date" className={STYLES.input} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className={STYLES.label}>Horário</label>
              <input required type="time" className={STYLES.input} value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={STYLES.label}>Tipo</label>
            <select className={STYLES.input} value={type} onChange={e => setType(e.target.value)}>
              <option value="Consulta">Consulta de Rotina</option>
              <option value="Avaliação">Avaliação Física</option>
              <option value="Personal">Treino Personal</option>
              <option value="Retorno">Retorno</option>
            </select>
          </div>
          <button type="submit" className={`${STYLES.btnPrimary} w-full mt-2`}>Confirmar Agendamento</button>
        </form>
      </div>
    </div>
  );
};

const DayDetailModal = ({ isOpen, onClose, date, appointments, users }) => {
  if (!isOpen) return null;
  const dayAppts = appointments.filter(a => a.date === date);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20} /> Detalhes do Dia</h3>
            <p className="text-slate-400 text-sm">{date ? new Date(date).toLocaleDateString('pt-BR', { dateStyle: 'full' }) : ''}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {dayAppts.length > 0 ? dayAppts.map((appt, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-mono font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg text-sm border border-indigo-100 shadow-sm">{appt.time}</div>
              <div>
                <p className="font-bold text-slate-900">{users.find(u => u.uid === appt.patientId)?.name || 'Paciente'}</p>
                <p className="text-xs text-slate-500 font-medium uppercase">{appt.type}</p>
              </div>
            </div>
          )) : <p className="text-center text-slate-500 py-4">Nenhum compromisso.</p>}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="w-full text-center text-slate-500 font-bold text-sm hover:text-slate-900">Fechar</button>
        </div>
      </div>
    </div>
  );
};

// 4. Admin View
const AdminView = ({ user: userData, allUsers, workouts }) => {
  const pendingProfessionals = allUsers.filter(u => u.role === 'professional' && u.status === 'pending');
  const approveUser = async (uid) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { status: 'active' });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <ShieldAlert className="text-indigo-600" size={32} />
              Painel Administrativo
            </h1>
            <p className="text-slate-500 font-medium mt-1">Bem-vindo, Administrador {userData.name}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
            <LogOut size={20} /> Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${STYLES.card} ${STYLES.cardPadding} border-l-8 border-l-indigo-500`}>
            <h3 className="text-slate-500 font-bold uppercase text-xs">Total Usuários</h3>
            <p className="text-4xl font-extrabold text-slate-900 mt-2">{allUsers.length}</p>
          </div>
          <div className={`${STYLES.card} ${STYLES.cardPadding} border-l-8 border-l-blue-500`}>
            <h3 className="text-slate-500 font-bold uppercase text-xs">Profissionais</h3>
            <p className="text-4xl font-extrabold text-slate-900 mt-2">{allUsers.filter(u => u.role === 'professional').length}</p>
          </div>
          <div className={`${STYLES.card} ${STYLES.cardPadding} border-l-8 border-l-green-500`}>
            <h3 className="text-slate-500 font-bold uppercase text-xs">Treinos Ativos</h3>
            <p className="text-4xl font-extrabold text-slate-900 mt-2">{workouts.length}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">Aprovações Pendentes</h2>
          <div className={STYLES.card + ' overflow-x-auto'}>
            {pendingProfessionals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">Nenhum profissional aguardando aprovação.</div>
            ) : (
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Data Cadastro</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingProfessionals.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{u.email}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => approveUser(u.uid)}
                          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors"
                        >
                          Aprovar Acesso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Professional
const ProfessionalView = ({ user: userData, allUsers, workouts, appointments, setAppointments, myLogs }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null); // New state for detail view
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');

  // Calendar & Appt State
  // Calendar & Appt State lifted to parent
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptModalData, setApptModalData] = useState(null);

  const openSchedule = (patientId = '') => {
    setApptModalData({ patientId, date: new Date().toISOString().split('T')[0] });
    setShowApptModal(true);
  };

  const handleSaveAppt = (newAppt) => {
    setAppointments([...appointments, newAppt]);
    alert(`Agendamento confirmado para ${newAppt.date} às ${newAppt.time}`);
  };

  const myPatients = allUsers.filter(u => u.role === 'patient');
  const todayAppts = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]);

  // Derived selected patient
  const selectedPatient = allUsers.find(u => u.uid === selectedPatientId);

  if (userData.status === 'pending') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-6">
          <Lock size={48} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Aguardando Aprovação</h1>
        <p className="text-slate-600 mt-2 max-w-md">Sua conta de profissional foi criada e está em análise pelo administrador. Você receberá acesso em breve.</p>
        <button onClick={handleLogout} className="mt-8 text-indigo-600 font-bold">Voltar ao Login</button>
      </div>
    );
  }

  const NavigationContent = () => (
    <>
      <div className="p-8 flex items-center gap-3 border-b border-slate-100">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200"><Activity size={24} /></div>
        <span className="font-extrabold text-xl tracking-tight text-slate-800">Fridman<span className="text-indigo-600">Pro</span></span>
      </div>
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {[
          { id: 'dashboard', icon: TrendingUp, label: 'Painel Geral' },
          { id: 'patients', icon: Users, label: 'Meus Pacientes' },
          { id: 'workouts', icon: Dumbbell, label: 'Criador de Treinos' },
          { id: 'schedule', icon: Calendar, label: 'Agenda' },
          { id: 'messages', icon: MessageSquare, label: 'Mensagens' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSelectedPatientId(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold rounded-xl transition-all ${activeTab === item.id && !selectedPatientId ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <item.icon size={20} className={activeTab === item.id && !selectedPatientId ? "text-indigo-600" : "text-slate-400"} /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={userData.name} size="md" className="border-2 border-indigo-200" />
          <div className="text-sm overflow-hidden">
            <p className="font-bold truncate text-slate-900">{userData.name}</p>
            <p className="text-xs text-indigo-500 font-medium">Profissional</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 font-bold hover:text-red-700 transition-colors w-full p-2 hover:bg-red-50 rounded-lg">
          <LogOut size={16} /> Encerrar Sessão
        </button>
      </div>
    </>
  );

  // Patient Detail View Component
  const PatientDetailView = ({ patient }) => {
    const [detailTab, setDetailTab] = useState('overview');
    const patientWorkouts = workouts.filter(w => w.assignedTo === patient.uid || !w.assignedTo /* For demo, showing all if undefined */);
    // Note: In real app, filter strictly. For demo, we might want to just show all workouts created or assigned.

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setSelectedPatientId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Detalhes do Paciente</h2>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <Avatar name={patient.name} size="xl" className="w-24 h-24 text-3xl shadow-lg border-4 border-slate-50" />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900">{patient.name}</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">Ativo</span>
            </div>
            <p className="text-slate-500 font-medium">{patient.email} • Desde {formatDate(patient.createdAt)}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
              <button className={STYLES.btnPrimary + " px-5 py-2 text-sm"}>
                <Upload size={18} /> Enviar Dieta
              </button>
              <button onClick={() => { setActiveTab('workouts'); setSelectedPatientId(null); /* Pre-select logic todo */ }} className={STYLES.btnSecondary + " px-5 py-2 text-sm"}>
                <Dumbbell size={18} /> Criar Treino
              </button>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl min-w-[200px] border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Plano Atual</p>
            <p className="text-xl font-extrabold text-indigo-600 mt-1">Premium Mensal</p>
            <p className="text-xs text-slate-500 mt-2">Renova em 15/01</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['overview', 'workouts', 'diets', 'progress'].map(t => (
            <button
              key={t}
              onClick={() => setDetailTab(t)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${detailTab === t ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {t === 'overview' ? 'Visão Geral' : t === 'workouts' ? 'Treinos' : t === 'diets' ? 'Dietas' : 'Progresso'}
            </button>
          ))}
        </div>

        {detailTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`${STYLES.card} p-6`}>
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={18} /> Última Avaliação</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                  <span className="text-sm text-slate-500">Peso</span>
                  <span className="font-bold text-slate-900">78.5 kg</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                  <span className="text-sm text-slate-500">Gordura Corporal</span>
                  <span className="font-bold text-indigo-600">14.2%</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-slate-500">Massa Magra</span>
                  <span className="font-bold text-slate-900">67.3 kg</span>
                </div>
              </div>
            </div>
            <div className={`${STYLES.card} p-6`}>
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Dumbbell size={18} /> Treino Atual</h4>
              {patientWorkouts.length > 0 ? (
                <div>
                  <p className="font-bold text-lg text-slate-900">{patientWorkouts[0].title}</p>
                  <p className="text-xs text-slate-400 mt-1">Atribuído em {formatDate(patientWorkouts[0].createdAt)}</p>
                  <button className="text-indigo-600 text-sm font-bold mt-4 hover:underline">Ver detalhes</button>
                </div>
              ) : <p className="text-slate-400 text-sm">Nenhum treino atribuído.</p>}
            </div>
            <div className={`${STYLES.card} p-6`}>
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={18} /> Dieta Atual</h4>
              <p className="font-bold text-lg text-slate-900">Cutting 2300kcal</p>
              <p className="text-xs text-slate-400 mt-1">Enviada em 01/12/2025</p>
              <button className="text-indigo-600 text-sm font-bold mt-4 hover:underline">Baixar PDF</button>
            </div>
          </div>
        )}

        {detailTab === 'workouts' && (
          <div className="space-y-4">
            {patientWorkouts.map(w => (
              <div key={w.id} className={`${STYLES.card} p-5 flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Dumbbell size={24} /></div>
                  <div>
                    <h4 className="font-bold text-slate-900">{w.title}</h4>
                    <p className="text-sm text-slate-500">{w.exercises?.length || 0} exercícios</p>
                  </div>
                </div>
                <button className="font-bold text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50">Editar</button>
              </div>
            ))}
            {patientWorkouts.length === 0 && <p className="text-center text-slate-500 py-8">Nenhum treino encontrado.</p>}
          </div>
        )}

        {/* Other tabs placeholders */}
        {(detailTab === 'diets' || detailTab === 'progress') && (
          <div className="text-center py-10 text-slate-400 italic bg-white rounded-3xl border border-slate-200">
            Funcionalidade em desenvolvimento...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">

      {/* Desktop Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex-col hidden md:flex shadow-xl z-10">
        <NavigationContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="w-3/4 max-w-sm bg-white relative flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <NavigationContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-700">
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg text-indigo-900">Fridman Care</span>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {selectedPatientId ? (
              <PatientDetailView patient={selectedPatient} />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`${STYLES.card} ${STYLES.cardPadding} bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none`}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-indigo-100 text-sm font-medium">Total de Pacientes</p>
                            <h3 className="text-4xl font-extrabold mt-1">{myPatients.length}</h3>
                          </div>
                          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Users size={24} /></div>
                        </div>
                        <div className="text-xs font-bold bg-white/20 inline-flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-sm"><TrendingUp size={12} /> +2 esta semana</div>
                      </div>

                      <div className={`${STYLES.card} ${STYLES.cardPadding}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-slate-400 font-bold text-xs uppercase">Consultas Hoje</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">{todayAppts.length}</h3>
                          </div>
                          <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Calendar size={24} /></div>
                        </div>
                        <div className="text-sm text-slate-500 font-medium">Próxima: 14:00</div>
                      </div>

                      <div className={`${STYLES.card} ${STYLES.cardPadding}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-slate-400 font-bold text-xs uppercase">Planos Ativos</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">{workouts.length}</h3>
                          </div>
                          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><Dumbbell size={24} /></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className={`${STYLES.card} p-6 md:p-8`}>
                        <h3 className={`${STYLES.h2} mb-6 flex items-center gap-2`}>
                          <Activity className="text-indigo-500" size={20} /> Atividade Recente
                        </h3>
                        <div className="space-y-6">
                          {myLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 group">
                              <Avatar
                                name={log.userName}
                                size="lg"
                                className="rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors"
                              />
                              <div>
                                <p className="font-bold text-slate-800">{log.userName}</p>
                                <p className="text-sm text-slate-500">Completou <span className="font-semibold text-indigo-600">{log.title}</span></p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">{formatDate(log.date)} • {log.totalVolume}kg Vol</p>
                              </div>
                            </div>
                          ))}
                          {myLogs.length === 0 && <p className="text-slate-400 text-sm font-medium italic">Nenhuma atividade recente.</p>}
                        </div>
                      </div>

                      {/* Recent Patients Card (Replaces Quick Actions) */}
                      <div className={`${STYLES.card} p-6 md:p-8`}>
                        <h3 className={`${STYLES.h2} mb-6`}>Pacientes Recentes</h3>
                        <div className="space-y-3">
                          {myPatients.slice(0, 4).map(p => (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPatientId(p.id)}
                              className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar name={p.name} size="md" className="bg-slate-100 group-hover:bg-indigo-100 text-indigo-600" />
                                <div>
                                  <p className="font-bold text-slate-900">{p.name}</p>
                                  <p className="text-xs text-slate-400">{p.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Ativo</span>
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400" />
                            </div>
                          ))}
                          {myPatients.length === 0 && <div className="text-slate-400 text-sm text-center py-4">Nenhum paciente ainda.</div>}
                          <button onClick={() => setActiveTab('patients')} className="w-full mt-4 text-center text-indigo-600 font-bold text-sm hover:underline">Ver todos</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'patients' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <h2 className={STYLES.h1}>Meus Pacientes</h2>
                      <button className={STYLES.btnPrimary}><Plus size={20} /> Adicionar Novo</button>
                    </div>
                    <div className={STYLES.card + ' overflow-x-auto'}>
                      <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                          <tr>
                            <th className="px-8 py-5">Paciente</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Plano Atual</th>
                            <th className="px-8 py-5 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {myPatients.map(patient => (
                            <tr
                              key={patient.id}
                              onClick={() => setSelectedPatientId(patient.id)}
                              className="hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    name={patient.name}
                                    size="md"
                                    className="bg-slate-200 text-slate-600 group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors"
                                  />
                                  <span className="font-bold text-slate-800 text-base">{patient.name}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Ativo</span></td>
                              <td className="px-8 py-5 text-slate-500 font-medium">Premium Mensal</td>
                              <td className="px-8 py-5 text-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedChatUser(patient.id); setActiveTab('messages'); }}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                  Mensagem
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'workouts' && (
                  <WorkoutBuilder onCreate={createWorkout} />
                )}

                {activeTab === 'schedule' && (
                  <div className="animate-in fade-in duration-500 space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className={STYLES.h1}>Agenda</h2>
                      <button onClick={() => openSchedule()} className={STYLES.btnPrimary}>
                        <Plus size={20} /> Novo Agendamento
                      </button>
                    </div>

                    <div className={`${STYLES.card} p-0 overflow-hidden`}>
                      <div className="p-6 flex justify-between items-center border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-900">Dezembro 2025</h3>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ChevronDown className="rotate-90" size={20} /></button>
                          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ChevronRight size={20} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d, i) => (
                          <div key={i} className="text-xs font-bold text-slate-400 uppercase py-3 text-center tracking-wider">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 bg-slate-100 gap-px border-b border-slate-100">
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = i + 1;
                          const dateStr = `2025-12-${day < 10 ? '0' + day : day}`;
                          const dayAppts = appointments.filter(a => a.date === dateStr);
                          const isToday = day === 12;

                          return (
                            <div
                              key={day}
                              onClick={() => { setApptModalData({ date: dateStr }); setShowDayModal(true); }}
                              className={`
                                   min-h-[120px] bg-white p-2 cursor-pointer transition-colors hover:bg-indigo-50/50 relative group
                                   ${isToday ? 'bg-indigo-50/30' : ''}
                                 `}
                            >
                              <span className={`
                                   text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-2
                                   ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 group-hover:text-indigo-600'}
                                 `}>
                                {day}
                              </span>

                              <div className="space-y-1">
                                {dayAppts.slice(0, 3).map((appt, idx) => (
                                  <div key={idx} className="text-[10px] font-bold px-1.5 py-1 rounded bg-indigo-50 text-indigo-700 truncate border border-indigo-100">
                                    {appt.time} {users.find(u => u.uid === appt.patientId)?.name.split(' ')[0]}
                                  </div>
                                ))}
                                {dayAppts.length > 3 && (
                                  <div className="text-[10px] font-bold text-slate-400 pl-1">
                                    +{dayAppts.length - 3} mais
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'messages' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-140px)] md:h-[600px] gap-6 animate-in fade-in duration-500">
                    {/* List (Hidden on mobile if chat selected) */}
                    <div className={`${STYLES.card} ${selectedChatUser ? 'hidden lg:flex' : 'flex'} col-span-1 overflow-hidden flex-col`}>
                      <div className="p-5 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 text-lg">Conversas</div>
                      <div className="overflow-y-auto flex-1 p-2">
                        {myPatients.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedChatUser(p.id)}
                            className={`w-full p-4 text-left rounded-xl flex items-center gap-4 transition-all mb-1 ${selectedChatUser === p.id ? 'bg-indigo-50 ring-1 ring-indigo-200 shadow-sm' : 'hover:bg-slate-50'}`}
                          >
                            <Avatar
                              name={p.name}
                              size="md"
                              className={selectedChatUser === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}
                            />
                            <span className={`font-bold ${selectedChatUser === p.id ? 'text-indigo-900' : 'text-slate-700'}`}>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat Area (Full width on mobile when selected) */}
                    <div className={`${selectedChatUser ? 'flex' : 'hidden lg:flex'} col-span-1 lg:col-span-2 h-full flex-col`}>
                      {selectedChatUser ? (
                        <div className="h-full flex flex-col">
                          <button onClick={() => setSelectedChatUser(null)} className="lg:hidden mb-4 text-sm text-indigo-600 font-bold flex items-center gap-1 bg-white p-2 rounded-lg w-fit shadow-sm"><ArrowLeft size={16} /> Voltar</button>
                          <ChatSystem currentUser={user} targetId={selectedChatUser} users={allUsers} onSchedule={openSchedule} />
                        </div>
                      ) : (
                        <div className={`${STYLES.card} h-full flex flex-col items-center justify-center text-slate-400 gap-4`}>
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageSquare size={32} />
                          </div>
                          <p className="font-medium">Selecione um paciente para iniciar o chat</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AppointmentModal
        isOpen={showApptModal}
        onClose={() => setShowApptModal(false)}
        onSave={handleSaveAppt}
        users={allUsers}
        initialData={apptModalData}
      />
      <DayDetailModal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        date={apptModalData?.date}
        appointments={appointments}
        users={allUsers}
      />
    </div >
  );
};
// Patient
const PatientView = ({ user: userData, allUsers, workouts, myLogs, setMyLogs }) => {
  const [tab, setTab] = useState('home');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const proUsers = allUsers.filter(u => u.role === 'professional');

  const saveWorkoutLog = (logData) => {
    const newLog = { ...logData, id: `log-${Date.now()}`, userName: userData.name, userId: userData.uid };
    setMyLogs([newLog, ...myLogs]);
    setActiveWorkout(null);
  };

  const handleStartWorkout = (plan, day) => {
    setActiveWorkout({
      id: `${plan.id}_${day.id}`,
      title: `${plan.title} - ${day.title}`,
      exercises: day.exercises,
      days: plan.days // Pass full days structure if needed by ActiveWorkout, or refactor ActiveWorkout to handle flat exercises
    });
  };

  if (activeWorkout) {
    return <ActiveWorkout workout={activeWorkout} onClose={() => setActiveWorkout(null)} onFinish={saveWorkoutLog} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24 md:pb-0 font-sans">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center md:hidden">
        <div className="font-extrabold text-xl text-indigo-600 flex items-center gap-2"><Activity size={20} /> Fridman</div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={24} /></button>
      </header>

      <div className="flex min-h-screen">
        <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-20 shadow-xl">
          <div className="p-8 text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-600" size={32} /> Fridman
          </div>
          <nav className="flex-1 space-y-2 p-6">
            {[
              { id: 'home', label: 'Início', icon: Activity },
              { id: 'training', label: 'Meus Treinos', icon: Dumbbell },
              { id: 'diet', label: 'Nutrição', icon: FileText },
              { id: 'messages', label: 'Contato Pro', icon: MessageSquare }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full text-left px-5 py-4 rounded-xl font-bold flex items-center gap-3 transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <t.icon size={20} /> {t.label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-slate-100">
            <button onClick={handleLogout} className="text-red-500 font-bold text-sm hover:bg-red-50 w-full p-3 rounded-xl flex items-center gap-2 transition-colors">
              <LogOut size={18} /> Sair do Sistema
            </button>
          </div>
        </div>

        <main className="flex-1 md:ml-72 p-6 md:p-10 max-w-5xl mx-auto w-full">

          {tab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Olá, {userData.name.split(' ')[0]} 👋</h1>
                  <p className="text-slate-500 font-medium mt-1">Hoje é um ótimo dia para evoluir.</p>
                </div>
                <div className="hidden md:block">
                  <Avatar name={userData.name} size="lg" className="border-2 border-indigo-200" />
                </div>
              </div>

              <div className={`${STYLES.card} p-6 md:p-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-200 border-none relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-indigo-100 text-lg">Seu Progresso Corporal</h3>
                    <Activity className="text-white/80" />
                  </div>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-4xl md:text-5xl font-extrabold tracking-tight">14.2%</span>
                    <span className="text-base text-indigo-200 mb-2 font-medium">Gordura Corporal</span>
                  </div>
                  <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div className="h-full bg-white w-[70%] rounded-full shadow-lg"></div>
                  </div>
                  <p className="text-sm text-indigo-100 mt-4 font-medium flex items-center gap-2">
                    <TrendingUp size={16} /> Queda de 1.5% comparado ao último mês. Excelente!
                  </p>
                </div>
              </div>

              <div>
                <h2 className={`${STYLES.h2} mb-4`}>Próximo Treino</h2>
                {workouts.length > 0 ? (
                  workouts.slice(0, 1).map(plan => {
                    const nextDay = plan.days?.[0]; // Start with first day for now
                    if (!nextDay) return null;

                    return (
                      <div key={plan.id} className={`${STYLES.card} p-0 flex flex-col md:flex-row group`}>
                        <div className="h-48 md:h-auto md:w-48 bg-slate-200 object-cover relative flex items-center justify-center">
                          <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-indigo-900/0 transition-colors"></div>
                          <Dumbbell size={48} className="text-slate-400" />
                        </div>
                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-extrabold text-xl md:text-2xl text-slate-800">{plan.title}</h3>
                              <p className="text-indigo-600 font-bold text-sm">{nextDay.title}</p>
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Fase 1</span>
                          </div>
                          <p className="text-slate-500 mb-6 font-medium">{nextDay.exercises.length} Exercícios • Duração Est. 45 min</p>
                          <button
                            onClick={() => handleStartWorkout(plan, nextDay)}
                            className={`${STYLES.btnPrimary} w-full md:w-auto self-start`}
                          >
                            <Play size={20} fill="currentColor" /> Iniciar Sessão
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={`${STYLES.card} p-8 text-center text-slate-500`}>Nenhum treino atribuído ainda.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'training' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className={STYLES.h1}>Seus Treinos</h2>
              <div className="grid grid-cols-1 gap-6">
                {workouts.map(plan => (
                  <div key={plan.id} className={`${STYLES.card} p-6 border-l-8 border-l-indigo-600`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Dumbbell size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-slate-900">{plan.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">{plan.days?.length || 0} dias de treino</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {plan.days?.map((day, idx) => (
                        <div key={day.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-indigo-100 transition-all group">
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-white text-slate-500 font-bold flex items-center justify-center text-xs border border-slate-200 group-hover:border-indigo-200 group-hover:text-indigo-600">{idx + 1}</span>
                            <div>
                              <h4 className="font-bold text-slate-800">{day.title}</h4>
                              <p className="text-xs text-slate-500">{day.exercises.length} exercícios</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleStartWorkout(plan, day)}
                            className="text-indigo-600 font-bold text-sm bg-white px-4 py-2 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                          >
                            Iniciar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <h2 className={`${STYLES.h1} mt-12`}>Histórico de Treinos</h2>
              {myLogs.length === 0 ? <p className="text-slate-500 text-sm font-medium italic">Nenhum treino registrado.</p> : (
                <div className="space-y-4">
                  {myLogs.map(log => (
                    <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{log.title}</h4>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{formatDate(log.date)}</span>
                      </div>
                      <div className="flex gap-6 text-sm text-slate-600 font-medium">
                        <span className="flex items-center gap-1"><Clock size={16} className="text-indigo-500" /> {Math.floor(log.duration / 60)}min</span>
                        <span className="flex items-center gap-1"><Dumbbell size={16} className="text-indigo-500" /> {log.totalVolume}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'diet' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className={STYLES.h1}>Nutrição e Dieta</h2>
              <div className={`${STYLES.card} p-10 flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-slate-200`}>
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                  <FileText size={40} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Plano Alimentar Atual</h3>
                  <p className="text-slate-500 text-sm mt-1">Atualizado por Dr. Fridman em 01/12/2025</p>
                </div>
                <button className={STYLES.btnSecondary}>
                  Baixar PDF da Dieta
                </button>
              </div>

              <div className={`${STYLES.card} p-8`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{SAMPLE_DIET.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{SAMPLE_DIET.calories} kcal • Objetivo: Cutting</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">Ativa</div>
                </div>

                <div className="space-y-6">
                  {SAMPLE_DIET.meals.map((meal, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-16 pt-1 text-right text-sm font-bold text-slate-400">{meal.time}</div>
                      <div className="flex-1 pb-6 border-l-2 border-slate-100 pl-6 relative">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-100 border-2 border-white ring-1 ring-indigo-200"></div>
                        <h4 className="font-bold text-slate-800 mb-2">{meal.name}</h4>
                        <ul className="space-y-1">
                          {meal.items.map((item, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'messages' && (
            <div className="h-[calc(100vh-140px)] md:h-[600px] animate-in fade-in duration-500">
              {selectedChatUser ? (
                <div className="h-full flex flex-col">
                  <button onClick={() => setSelectedChatUser(null)} className="md:hidden mb-4 text-sm text-indigo-600 font-bold flex items-center bg-indigo-50 w-fit px-3 py-1 rounded-full"><ChevronDown className="rotate-90" /> Voltar</button>
                  <ChatSystem currentUser={user} targetId={selectedChatUser} users={allUsers} />
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className={STYLES.h1}>Seus Profissionais</h2>
                  {proUsers.length === 0 && <p className="text-slate-500 italic">Nenhum profissional disponível.</p>}
                  {proUsers.map(p => (
                    <div key={p.id} onClick={() => setSelectedChatUser(p.id)} className={`${STYLES.card} p-6 flex items-center gap-6 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all`}>
                      <Avatar name={p.name} size="xl" className="rounded-2xl shadow-sm" />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">Toque para enviar mensagem</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-full text-slate-400">
                        <MessageSquare size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around py-4 pb-safe md:hidden z-30 shadow-lg">
        <button onClick={() => setTab('home')} className={`flex flex-col items-center gap-1 ${tab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Activity size={24} strokeWidth={tab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setTab('training')} className={`flex flex-col items-center gap-1 ${tab === 'training' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Dumbbell size={24} strokeWidth={tab === 'training' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Treino</span>
        </button>
        <button onClick={() => setTab('diet')} className={`flex flex-col items-center gap-1 ${tab === 'diet' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <FileText size={24} strokeWidth={tab === 'diet' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Dieta</span>
        </button>
        <button onClick={() => setTab('messages')} className={`flex flex-col items-center gap-1 ${tab === 'messages' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <MessageSquare size={24} strokeWidth={tab === 'messages' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Chat</span>
        </button>
      </nav>
    </div>
  );
};



// --- WORKOUT BUILDER ---
function WorkoutBuilder({ onCreate }) {
  const PRESET_EXERCISES = [
    "Lat Pulldown (Reverse Grip)",
    "Seated Cable Row",
    "Dumbbell Bench Press",
    "Leg Press",
    "Shoulder Press",
    "Squat",
    "Deadlift"
  ];

  const [title, setTitle] = useState('');
  const [days, setDays] = useState([{ id: 'day-1', title: 'Dia 1', exercises: [] }]);
  const [activeDayId, setActiveDayId] = useState('day-1');

  // Current exercise input state
  const [currentEx, setCurrentEx] = useState({ name: '', sets: 3, reps: 10, weight: 0 });

  const activeDay = days.find(d => d.id === activeDayId);

  const addExercise = () => {
    if (!currentEx.name) return;
    const newEx = {
      ...currentEx,
      sets: Array(currentEx.sets).fill({ reps: currentEx.reps, weight: currentEx.weight })
    };

    setDays(days.map(d => {
      if (d.id === activeDayId) {
        return { ...d, exercises: [...d.exercises, newEx] };
      }
      return d;
    }));
    setCurrentEx({ name: '', sets: 3, reps: 10, weight: 0 });
  };

  const addDay = () => {
    const newId = `day-${days.length + 1}`;
    setDays([...days, { id: newId, title: `Dia ${days.length + 1}`, exercises: [] }]);
    setActiveDayId(newId);
  };

  const handleCreate = () => {
    if (!title || days.length === 0) return;
    onCreate({ title, days });
    setTitle('');
    setDays([{ id: 'day-1', title: 'Dia 1', exercises: [] }]);
    setActiveDayId('day-1');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className={STYLES.h1}>Novo Plano de Treino</h2>
        <button onClick={handleCreate} className={`${STYLES.btnPrimary} shadow-xl shadow-indigo-300/50`}>
          <Save size={20} /> Salvar Plano
        </button>
      </div>

      <div className={STYLES.card + ' ' + STYLES.cardPadding}>
        <div className="mb-6">
          <label className={STYLES.label}>Nome do Plano</label>
          <input type="text" className={STYLES.input} placeholder="Ex: Hipertrofia Fase 1" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Days Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {days.map(day => (
            <button
              key={day.id}
              onClick={() => setActiveDayId(day.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeDayId === day.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <Calendar size={14} />
              {activeDayId === day.id ? (
                <input
                  className="bg-transparent border-b border-white/50 w-20 outline-none"
                  value={day.title}
                  onChange={(e) => setDays(days.map(d => d.id === day.id ? { ...d, title: e.target.value } : d))}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : day.title}
            </button>
          ))}
          <button onClick={addDay} className="px-4 py-2 rounded-lg font-bold text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1">
            <Plus size={16} /> Adicionar Dia
          </button>
        </div>

        {/* Exercise Builder for Active Day */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Dumbbell size={18} className="text-indigo-500" />
            Exercícios para <span className="text-indigo-600">{activeDay?.title}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Exercício</label>
              <input
                type="text"
                list="exercises-list"
                className={STYLES.input}
                placeholder="Busque ou digite..."
                value={currentEx.name}
                onChange={e => setCurrentEx({ ...currentEx, name: e.target.value })}
              />
              <datalist id="exercises-list">
                {PRESET_EXERCISES.map(ex => <option key={ex} value={ex} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase text-center block">Séries</label>
                <input type="number" className={STYLES.input + ' text-center'} placeholder="3" value={currentEx.sets} onChange={e => setCurrentEx({ ...currentEx, sets: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase text-center block">Reps</label>
                <input type="number" className={STYLES.input + ' text-center'} placeholder="12" value={currentEx.reps} onChange={e => setCurrentEx({ ...currentEx, reps: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase text-center block">Kg</label>
                <input type="number" className={STYLES.input + ' text-center'} placeholder="0" value={currentEx.weight} onChange={e => setCurrentEx({ ...currentEx, weight: parseInt(e.target.value) })} />
              </div>
            </div>
          </div>
          <button onClick={addExercise} className="bg-white text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 p-3 rounded-xl w-full transition-colors border border-slate-200 hover:border-indigo-300 shadow-sm">
            <Plus size={18} /> Adicionar Exercício
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {activeDay?.exercises.map((ex, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm animate-in slide-in-from-left-2 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {i + 1}
              </div>
              <div>
                <p className="font-bold text-slate-900">{ex.name}</p>
                <p className="text-xs text-slate-500 font-medium">{ex.sets.length} séries • {ex.sets[0].reps} reps • {ex.sets[0].weight}kg</p>
              </div>
            </div>
            <button onClick={() => {
              const newDays = [...days];
              const dayIndex = newDays.findIndex(d => d.id === activeDayId);
              newDays[dayIndex].exercises = newDays[dayIndex].exercises.filter((_, idx) => idx !== i);
              setDays(newDays);
            }} className="text-slate-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors"><X size={20} /></button>
          </div>
        ))}
        {activeDay?.exercises.length === 0 && <div className="text-center text-slate-400 py-12 italic border-2 border-dashed border-slate-100 rounded-xl">Nenhum exercício neste dia.</div>}
      </div>
    </div>
  );
}

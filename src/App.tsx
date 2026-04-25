import { useState, useRef, useEffect } from 'react';
import {
  Home, Activity, ListTodo, Route, Settings,
  Search, Plus, Bell, MoreHorizontal, User,
  Heart, Thermometer, Mic, ShieldAlert, Bot, X, Upload
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { processAndUploadPDF } from './lib/knowledge';
import { InterviewerAgent } from './lib/InterviewerAgent';
import { supabase } from './lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import LandingPage from './LandingPage';

// --- DATA ---
const bpData = [
  { name: 'Mon', systolic: 120, diastolic: 80 },
  { name: 'Tue', systolic: 122, diastolic: 81 },
  { name: 'Wed', systolic: 118, diastolic: 79 },
  { name: 'Thu', systolic: 125, diastolic: 85 },
  { name: 'Fri', systolic: 121, diastolic: 82 },
];

export default function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [isAgentFeedOpen, setIsAgentFeedOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState('How are you feeling today?');
  const [userTranscript, setUserTranscript] = useState('');
  
  // Auth state
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const agentRef = useRef<InterviewerAgent | null>(null);

  import.meta.hot?.on('vite:beforeUpdate', () => {
    // optional logic
  });

  // Fetch initial auth state
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        setTranscript("Communication stopped.");
        if (agentRef.current) {
          agentRef.current.disconnect();
          agentRef.current = null;
        }
      } else {
        setIsRecording(true);
        setTranscript("Connecting to Aayu...");
        setUserTranscript("");
        const agent = new InterviewerAgent();
        agentRef.current = agent;
        agent.onMessage((text, isFinal) => {
          setTranscript(text);
        });
        agent.onInputMessage((text) => {
          setUserTranscript(text);
        });
        await agent.connect();
        await agent.startMicrophone(); // START AUDIO RECORDING CAPTURE
      }
    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setTranscript("Error connecting to Gemini Audio.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await processAndUploadPDF(file, user?.id || '00000000-0000-0000-0000-000000000000');
      alert('PDF Hospital Report successfully embedded and stored in the database!');
    } catch (error) {
      console.error(error);
      alert('Failed to process PDF. Check console for details.');
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) {
    return <div className="h-screen bg-[#FDF8F3] flex items-center justify-center font-sans">Loading Aayu...</div>;
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="flex h-screen bg-[#FDF8F3] font-sans overflow-hidden">

      {/* Left Sidebar */}
      <aside className="w-64 bg-white flex flex-col items-center py-8 px-6 rounded-r-[2rem] shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-2 w-full pl-2 mb-10">
          <Activity className="w-6 h-6 text-purple-600" />
          <span className="text-xl font-bold text-gray-800 tracking-wide">Aayu</span>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-md">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-blue-500" />
            )}
          </div>
          <span className="text-xs font-semibold text-orange-500 bg-orange-100 px-3 py-1 rounded-full mb-2">Patient</span>
          <h2 className="font-bold text-gray-800">{user?.user_metadata?.full_name || 'Aama Thapa'}</h2>
          <p className="text-sm text-gray-500">Connected via Google</p>
        </div>

        <nav className="w-full space-y-2 flex-1">
          {[
            { name: 'Dashboard', icon: Home },
            { name: 'Analytics', icon: Activity },
            { name: 'Alerts', icon: ShieldAlert },
            { name: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeMenu === item.name
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          ))}
          <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-50 hover:text-red-700 mt-auto"
            >
              <User className="w-5 h-5" />
              <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-10 py-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {activeMenu === 'Dashboard' ? 'Aayu Voice Assistant' : 'Health Analytics'}
            </h1>
            <p className="text-gray-500 mt-1">
              {activeMenu === 'Dashboard' ? 'Talk to Aayu seamlessly' : 'Overview of health metrics'}
            </p>
          </div>

          <div className="flex items-center">
            {activeMenu === 'Analytics' && (
              <div className="flex items-center space-x-4">
                <button className="p-2.5 bg-white rounded-xl shadow-sm text-gray-500 hover:text-purple-600">
                  <Search className="w-5 h-5" />
                </button>
                <button className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Reminder</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsAgentFeedOpen(!isAgentFeedOpen)}
              className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-purple-50 text-purple-600 relative transition-colors ml-4"
            >
              <Bot className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </header>

        {activeMenu === 'Dashboard' && (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto pb-12">

            <div className="text-center mb-12">
              <h2 className="text-3xl font-medium text-gray-700 mb-2">नमस्ते आमा (Namaste Aama)</h2>
              <p className="text-lg text-gray-500">How are you feeling today?</p>
            </div>

            <div className="relative flex items-center justify-center mt-12 w-full h-64">
              {isRecording && (
                <motion.div
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.2, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeOut"
                  }}
                  className="absolute w-40 h-40 bg-[var(--color-brand-purple)] rounded-full"
                />
              )}

              <button
                onClick={toggleRecording}
                className={`relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-300 z-10 ${isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[var(--color-brand-purple)] hover:bg-purple-700'
                  }`}
              >
                <Mic className="w-16 h-16 text-white" />
              </button>
            </div>

            {/* Split Transcript UI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 w-full min-h-[150px] flex flex-col items-center justify-center text-center mt-8 gap-4"
            >
              {isRecording ? (
                <div className="w-full flex flex-col space-y-4">
                  <div className="w-full bg-purple-50 p-4 rounded-xl text-left border border-purple-100 relative">
                    <span className="text-xs font-bold text-purple-400 absolute top-2 right-3 uppercase">Aayu AI</span>
                    <p className="text-lg font-medium text-purple-700 mt-2">{transcript}</p>
                  </div>
                  {userTranscript && (
                    <div className="w-full bg-blue-50 p-4 rounded-xl text-left border border-blue-100 relative">
                      <span className="text-xs font-bold text-blue-400 absolute top-2 right-3 uppercase">You</span>
                      <p className="text-lg font-medium text-blue-700 mt-2">{userTranscript}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xl font-medium leading-relaxed text-gray-700">
                  {transcript === 'Communication stopped.' ? 'Communication stopped.' : 'Tap the microphone to start talking!'}
                </p>
              )}
            </motion.div>

          </div>
        )}

        {activeMenu === 'Analytics' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Top Feature Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-purple-700 text-white p-6 rounded-[2rem] shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Heart className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">Latest BP</span>
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-4xl font-bold mb-2">120/80</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-purple-900/50 rounded-full h-1.5">
                      <div className="bg-green-400 h-1.5 rounded-full w-[60%]"></div>
                    </div>
                    <span className="text-sm font-medium">Normal</span>
                  </div>
                </div>
              </div>

              <div className="bg-teal-500 text-white p-6 rounded-[2rem] shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Thermometer className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">Medicine</span>
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-4xl font-bold mb-2">Taken</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-teal-700/50 rounded-full h-1.5">
                      <div className="bg-white h-1.5 rounded-full w-[100%]"></div>
                    </div>
                    <span className="text-sm font-medium">100%</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500 text-white p-6 rounded-[2rem] shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Activity className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">Overall Status</span>
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Stable</h3>
                  <p className="text-orange-100 text-sm mt-4">Last interaction 2 hrs ago</p>
                </div>
              </div>
            </div>

            {/* Charts & Stats Area */}
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 bg-white p-6 rounded-3xl shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 text-lg">Blood Pressure Trend</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={bpData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="systolic" stroke="#6c2bd9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="diastolic" stroke="#63c5ce" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-span-1 grid grid-rows-2 gap-6">
                <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col justify-center items-center text-center">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                    <span className="font-bold text-xl">14</span>
                  </div>
                  <h4 className="font-bold text-gray-800">Interactions</h4>
                  <p className="text-sm text-gray-500 mt-1">This week</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl shadow-sm p-6 relative overflow-hidden border border-blue-100 flex flex-col items-center justify-center text-center">
                  <h4 className="font-bold text-gray-800 mb-2">Knowledge Base</h4>
                  <p className="text-sm text-gray-500 mb-4">Upload hospital reports to train Aayu.</p>
                  <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors z-10 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                    <Upload className="w-4 h-4" />
                    <span className="font-medium text-sm">{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-200/50 rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar (Agent Logic Feed) */}
      {isAgentFeedOpen && (
        <aside className="w-80 bg-[#FAEEE4] py-8 px-6 rounded-l-[2rem] shadow-sm z-20 flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300 border-l border-white/50 absolute right-0 h-full">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-bold text-gray-800 text-lg">Agent Logic Feed</h3>
            <button
              onClick={() => setIsAgentFeedOpen(false)}
              className="p-2 bg-white rounded-full text-gray-500 shadow-sm hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {/* Active Listening State for Dashboard Mode */}
            {activeMenu === 'Dashboard' && isRecording && (
              <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:w-[2px] before:h-full before:bg-purple-200 last:before:h-0 animate-in fade-in slide-in-from-top-4">
                <div className="absolute left-1 top-1.5 w-2.5 h-2.5 bg-purple-500 rounded-full ring-4 ring-[#FAEEE4] animate-pulse"></div>
                <div className="flex justify-between items-center mb-1 text-xs text-gray-500 font-medium">
                  <span>Now</span>
                  <span className="text-purple-600 bg-purple-100 px-2 rounded animate-pulse">Interviewer</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-200 mt-2">
                  <p className="text-sm text-gray-700 font-medium">Listening to audio stream...</p>
                  <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </p>
                </div>
              </div>
            )}

            {/* Feed Item */}
            <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:w-[2px] before:h-full before:bg-orange-200 last:before:h-0">
              <div className="absolute left-1 top-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full ring-4 ring-[#FAEEE4]"></div>
              <div className="flex justify-between items-center mb-1 text-xs text-gray-500 font-medium">
                <span>10:00 AM</span>
                <span className="text-purple-600 bg-purple-100 px-2 rounded">Interviewer</span>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100/50 mt-2">
                <p className="text-sm text-gray-700 font-medium">Greeting & Vitals Check</p>
                <p className="text-xs text-gray-500 mt-1">Asked about morning medicine and checked visual BP logging.</p>
              </div>
            </div>

            <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:w-[2px] before:h-full before:bg-orange-200 last:before:h-0">
              <div className="absolute left-1 top-1.5 w-2.5 h-2.5 bg-teal-500 rounded-full ring-4 ring-[#FAEEE4]"></div>
              <div className="flex justify-between items-center mb-1 text-xs text-gray-500 font-medium">
                <span>10:02 AM</span>
                <span className="text-teal-600 bg-teal-100 px-2 rounded">Clinical Analyst</span>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-teal-100/50 mt-2">
                <p className="text-sm text-gray-700 font-medium">Cross-Reference Data</p>
                <p className="text-xs text-gray-500 mt-1">Analyzed BP 120/80 against baseline (130/85). Confirmed normal.</p>
              </div>
            </div>

            <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:w-[2px] before:h-full before:bg-orange-200 last:before:h-0">
              <div className="absolute left-1 top-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-[#FAEEE4]"></div>
              <div className="flex justify-between items-center mb-1 text-xs text-gray-500 font-medium">
                <span>Yesterday, 8:00 PM</span>
                <span className="text-blue-600 bg-blue-100 px-2 rounded">Guardian</span>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100/50 mt-2">
                <p className="text-sm text-gray-700 font-medium">Evening Summary Sent</p>
                <p className="text-xs text-gray-500 mt-1">Compiled daily interaction summary and logged to database.</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #fbdcae;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}

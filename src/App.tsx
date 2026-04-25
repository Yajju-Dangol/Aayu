import { useState, useRef, useEffect } from 'react';
import {
  Home, Activity, Settings,
  Search, Plus, User,
  Heart, Thermometer, Mic, ShieldAlert, Bot, X, Upload, MoreHorizontal,
  Coffee, Utensils, Droplets, Battery, Pill, Stethoscope, Moon, Users, TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { processAndUploadPDF } from './lib/knowledge';
import { InterviewerAgent } from './lib/InterviewerAgent';
import { supabase } from './lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
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
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const agentRef = useRef<InterviewerAgent | null>(null);

  import.meta.hot?.on('vite:beforeUpdate', () => {
    // optional logic
  });

  // Fetch initial auth state
  
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setSession(session);
      setLoadingAuth(false);
      if (currentUser) {
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || currentUser.email || 'Unknown User',
          }, { onConflict: 'id' });
          if (error) console.error('[Auth] profiles upsert error:', error.message, error.details);
          else console.log('[Auth] Profile synced for user:', currentUser.id);
        } catch (e) {
          console.error('[Auth] profiles upsert threw:', e);
        }
      }
    }).catch(e => console.error('[Auth] getSession error:', e));

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event}`);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setSession(session);
      setLoadingAuth(false);
      
      if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || currentUser.email || 'Unknown User',
          }, { onConflict: 'id' });
          if (error) console.error('[Auth] profiles sync error:', error.message);
        } catch (e) {
          console.error('[Auth] profiles sync failed:', e);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch and subscribe to Agent Logs
  useEffect(() => {
    if (!user) return;
    
    // Fetch initial logs
    supabase.from('health_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_type', 'agent_action')
      .order('logged_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data) setAgentLogs(data);
      });

    // Subscribe to new logs
    const channel = supabase.channel('agent_logs_changes')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'health_logs', 
          filter: `user_id=eq.${user.id}` 
       }, (payload) => {
          if (payload.new.log_type === 'agent_action') {
             setAgentLogs(prev => [payload.new, ...prev]);
          }
      })
      .subscribe();

    // Fetch initial analytics
    supabase.from('health_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('metric_type', 'session_analysis')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (!error && data && data.details) setAnalyticsData(data.details);
      });

    // Subscribe to new analytics
    const analyticsChannel = supabase.channel('analytics_changes')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'health_metrics', 
          filter: `user_id=eq.${user.id}` 
       }, (payload) => {
          if (payload.new.metric_type === 'session_analysis' && payload.new.details) {
             setAnalyticsData(payload.new.details);
          }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(analyticsChannel);
    };
  }, [user]);

  const formatToolName = (name: string) => {
    switch (name) {
      case 'searchHealthKnowledge': return 'Knowledge Base Search';
      case 'logBloodPressure': return 'Logged Blood Pressure';
      case 'logMedicineTaken': return 'Logged Medicine Status';
      case 'logMoodAndWellness': return 'Logged Mood';
      case 'logSymptom': return 'Logged Symptom';
      case 'logDietaryInfo': return 'Logged Dietary Info';
      case 'logHydrationStatus': return 'Logged Hydration';
      case 'logSleepAndEnergy': return 'Logged Sleep & Energy';
      case 'logSocialInteraction': return 'Logged Social Interaction';
      default: return name;
    }
  };

  const formatToolArgs = (args: any) => {
    if (!args) return 'Performed action.';
    const entries = Object.entries(args).map(([k, v]) => `${k}: ${v}`);
    return entries.length > 0 ? entries.join(', ') : 'No additional details.';
  };

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        setTranscript("Communication stopped.");
        if (agentRef.current) {
          const finalTranscript = agentRef.current.fullTranscript;
          agentRef.current.disconnect();
          agentRef.current = null;
          
          if (user) {
            console.log("Session ended.");
          } else {
            alert("No conversation data was recorded during this session.");
          }
        }
      } else {
        setIsRecording(true);
        setTranscript("Connecting to Aayu...");
        setUserTranscript("");
        if (!user) throw new Error("User not logged in");
        const agent = new InterviewerAgent(user.id, session?.access_token);
        agentRef.current = agent;

        // CRITICAL: unlockAudio must be called synchronously inside the click handler
        // to satisfy the browser's autoplay gesture requirement
        agent.unlockAudio();

        agent.onStatus((status) => {
          setTranscript(status);
        });
        agent.onMessage((text) => {
          setTranscript(text);
        });
        agent.onInputMessage((text) => {
          setUserTranscript(text);
        });
        await agent.connect();
        setTranscript('नमस्ते! Aayu is listening...'); // guaranteed status clear
        await agent.startMicrophone();
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
      await processAndUploadPDF(file, user?.id || '', session?.access_token || '');
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

  const handleGetLatestData = async () => {
    if (!user) {
      console.warn("No user found.");
      return;
    }
    setIsAnalyzing(true);
    
    try {
      console.log("Fetching health logs for today...");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const token = session?.access_token || supabaseAnonKey;

      // Raw fetch to bypass supabase-js internal queueing/hanging
      const logsRes = await fetch(`${supabaseUrl}/rest/v1/health_logs?select=*&user_id=eq.${user.id}&logged_at=gte.${today.toISOString()}`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!logsRes.ok) {
        throw new Error(`Failed to fetch logs: ${await logsRes.text()}`);
      }
      
      const logs = await logsRes.json();
      console.log(`Found ${logs?.length || 0} logs for today.`);

      if (!logs || logs.length === 0) {
        console.warn("No logs found, sending empty logs to Gemini.");
      }

      const systemInstruction = `
You are a medical data extraction assistant.
Analyze the provided agent tool logs for today.
Extract the following information and output it as a valid JSON object. 
If an answer is missing, return "N/A" for that field.
- meal_composition: What did they have for meals? (e.g., Rice, Lentils, Spinach)
- portion_size: Did they finish the whole plate, or just half?
- hydration: How many glasses of water/tea have they had?
- appetite_levels: Are they feeling hungry or forced to eat?
- medication: Did they take all medicines for the day?
- symptoms: Any symptoms mentioned?
- sleep_quality: Wake up frequency, do they feel rested?
- energy_levels: Energy level on a scale of 1 to 5.
- social_interaction: Who did they talk to today?

Output strictly JSON. Do not include markdown formatting like \`\`\`json.`;

      const prompt = `AGENT LOGS TODAY:\n${JSON.stringify(logs, null, 2)}`;
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in .env");
      }
      
      console.log("Calling Gemini API...");
      const controller = new AbortController();
      const fetchTimeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });
      clearTimeout(fetchTimeoutId);

      console.log("Gemini response status:", geminiRes.status);
      const geminiData = await geminiRes.json();
      
      if (!geminiRes.ok) {
        throw new Error(geminiData.error?.message || "Unknown error from Gemini");
      }
      if (geminiData.error) {
        throw new Error(geminiData.error.message);
      }

      let jsonStr = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      console.log("Extracted JSON:", jsonStr);
      
      const metricsData = JSON.parse(jsonStr);

      console.log("Uploading to Supabase health_metrics...");
      
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/health_metrics`, {
        method: "POST",
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: user.id,
          metric_type: 'session_analysis',
          details: metricsData,
          recorded_at: new Date().toISOString()
        })
      });

      if (!insertRes.ok) {
        throw new Error(`Failed to save metrics: ${await insertRes.text()}`);
      }

      console.log("Success! Updating UI state.");
      setAnalyticsData(metricsData);
    } catch (err: any) {
      console.error("Error in handleGetLatestData:", err);
      if (err.name === 'AbortError') {
        alert("Request timed out. Please check your internet connection.");
      } else {
        alert("Failed to analyze data: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetTrends = async () => {
    if (!user) return;
    setIsFetchingTrends(true);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const token = session?.access_token || supabaseAnonKey;

      const metricsRes = await fetch(`${supabaseUrl}/rest/v1/health_metrics?select=*&user_id=eq.${user.id}&metric_type=eq.session_analysis&order=recorded_at.asc`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!metricsRes.ok) throw new Error(await metricsRes.text());
      const allMetrics = await metricsRes.json();

      if (!allMetrics || allMetrics.length === 0) {
        alert("Not enough historical data to generate trends.");
        return;
      }

      const promptData = allMetrics.map((m: any) => ({
        date: new Date(m.recorded_at).toLocaleDateString(),
        data: m.details
      }));

      const systemInstruction = `
You are a medical data analyst. You are given a time-series of a patient's daily health logs.
Analyze the data and output a JSON object to populate charts for long-term trends.
The JSON must strictly match this structure:
{
  "chartData": [
    {
      "date": "MM/DD",
      "hydrationScore": (integer 0-10),
      "energyScore": (integer 1-5),
      "sleepScore": (integer 0-10),
      "carbsScore": (integer 0-10)
    }
  ],
  "insights": [
    "A 1-2 sentence clinically valuable insight regarding their Metabolic & Nutritional Trends.",
    "A 1-2 sentence clinically valuable insight regarding their Circadian & Energy Health.",
    "A 1-2 sentence clinically valuable insight regarding their Symptom & Medication Correlation."
  ]
}
Output STRICTLY JSON. Do NOT include markdown formatting like \`\`\`json.`;

      const prompt = `HISTORICAL DATA:\n${JSON.stringify(promptData, null, 2)}`;
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      const geminiData = await geminiRes.json();
      if (!geminiRes.ok) throw new Error(geminiData.error?.message);

      let jsonStr = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      setTrendsData(JSON.parse(jsonStr));

    } catch (err: any) {
      console.error("Error in handleGetTrends:", err);
      alert("Failed to fetch trends: " + err.message);
    } finally {
      setIsFetchingTrends(false);
    }
  };

  const handleLogout = () => {
    // Fire and forget the server-side logout
    supabase.auth.signOut().catch(console.error);
    
    // Aggressively clear local state immediately
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = '/';
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

        <nav className="w-full flex flex-col space-y-2 flex-1">
          {[
            { name: 'Dashboard', icon: Home },
            { name: 'Analytics', icon: Activity },
            { name: 'Trends', icon: TrendingUp },
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
              {activeMenu === 'Dashboard' ? 'Aayu Voice Assistant' : 
               activeMenu === 'Trends' ? 'Long-Term Trends' : 'Health Analytics'}
            </h1>
            <p className="text-gray-500 mt-1">
              {activeMenu === 'Dashboard' ? 'Talk to Aayu seamlessly' : 
               activeMenu === 'Trends' ? 'Track your health evolution over time' : 'Overview of health metrics'}
            </p>
          </div>

          <div className="flex items-center">
            {activeMenu === 'Analytics' && (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleGetLatestData}
                  disabled={isAnalyzing}
                  className={`flex items-center space-x-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-colors ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Bot className="w-5 h-5" />
                  <span className="font-medium">{isAnalyzing ? 'Analyzing...' : 'Get Latest Data'}</span>
                </button>
              </div>
            )}
            
            {activeMenu === 'Trends' && (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleGetTrends}
                  disabled={isFetchingTrends}
                  className={`flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors ${isFetchingTrends ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">{isFetchingTrends ? 'Processing...' : 'Get Trends'}</span>
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

        {activeMenu === 'Trends' && (
          <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto pb-12">
            {!trendsData ? (
              <div className="text-center py-20 mt-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-10 h-10 text-blue-500" />
                </div>
                <h4 className="text-xl font-bold text-gray-700 mb-2">No Trends Yet</h4>
                <p className="text-gray-500 max-w-md mx-auto">Click 'Get Trends' to let Gemini analyze your long-term health metrics and build insights graphs.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* AI Insights List */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Bot className="text-blue-500" />
                    AI Clinical Insights
                  </h3>
                  <div className="space-y-4">
                    {trendsData.insights?.map((insight: string, idx: number) => (
                      <div key={idx} className="p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 font-medium">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Metabolic & Nutritional Trends</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendsData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                          <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Line type="monotone" dataKey="hydrationScore" name="Hydration" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6'}} activeDot={{r: 6}} />
                          <Line type="monotone" dataKey="carbsScore" name="Carbs/Portion" stroke="#F59E0B" strokeWidth={3} dot={{r: 4, fill: '#F59E0B'}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Circadian & Energy Health</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendsData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                          <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Line type="monotone" dataKey="sleepScore" name="Sleep Quality" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4, fill: '#8B5CF6'}} activeDot={{r: 6}} />
                          <Line type="monotone" dataKey="energyScore" name="Energy Level" stroke="#10B981" strokeWidth={3} dot={{r: 4, fill: '#10B981'}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {activeMenu === 'Analytics' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-gray-800 text-2xl">Session AI Insights</h3>
                <span className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  Latest Data Interpretation
                </span>
              </div>
              
              {analyticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-500 rounded-lg text-white">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-blue-900">Meal Composition</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.meal_composition || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-orange-500 rounded-lg text-white">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-orange-900">Portion Size</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.portion_size || 'N/A'}</p>
                  </div>

                  <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-teal-500 rounded-lg text-white">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-teal-900">Hydration</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.hydration || 'N/A'}</p>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg text-white">
                        <Coffee className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-purple-900">Appetite Levels</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.appetite_levels || 'N/A'}</p>
                  </div>

                  <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-pink-500 rounded-lg text-white">
                        <Pill className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-pink-900">Medication</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.medication || 'N/A'}</p>
                  </div>

                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-red-500 rounded-lg text-white">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-red-900">Symptom Check</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.symptoms || 'N/A'}</p>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-indigo-500 rounded-lg text-white">
                        <Moon className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-indigo-900">Sleep Quality</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.sleep_quality || 'N/A'}</p>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-yellow-500 rounded-lg text-white">
                        <Battery className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-yellow-900">Energy Levels</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.energy_levels || 'N/A'}</p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-500 rounded-lg text-white">
                        <Users className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-green-900">Social Interaction</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{analyticsData.social_interaction || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">No Insights Yet</h4>
                  <p className="text-gray-500">Have a session with Aayu first. After the session, Gemini will automatically interpret the health data here.</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl shadow-sm p-8 relative overflow-hidden border border-blue-100 flex flex-col items-center justify-center text-center">
              <h4 className="font-bold text-gray-800 text-xl mb-3">Knowledge Base</h4>
              <p className="text-gray-600 mb-6">Upload hospital reports and medical history to train Aayu for personalized care.</p>
              <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-3 transition-colors z-10 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                <Upload className="w-5 h-5" />
                <span className="font-medium">{isUploading ? 'Uploading & Processing...' : 'Upload Medical PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-200/50 rounded-full blur-2xl"></div>
              <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-200/30 rounded-full blur-xl"></div>
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

            {agentLogs.length === 0 && (
              <div className="text-center text-sm text-gray-400 italic mt-8 p-4 bg-white/50 rounded-xl border border-dashed border-gray-200">
                Awaiting agent activity... <br/> Ask Aayu to check your vitals or search your records.
              </div>
            )}

            {agentLogs.map((log) => {
               const timeStr = new Date(log.logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
               const title = formatToolName(log.data?.action || '');
               const desc = formatToolArgs(log.data?.args);
               
               // Generate a simple deterministic color based on the action name
               const colors = ['orange', 'teal', 'blue', 'purple', 'pink'];
               const colorIndex = log.data?.action ? log.data.action.length % colors.length : 0;
               const color = colors[colorIndex];
               // Map colors statically for Tailwind to detect
               const colorStyles: Record<string, any> = {
                 orange: {
                   line: 'before:bg-orange-200',
                   dot: 'bg-orange-500',
                   badgeText: 'text-orange-600',
                   badgeBg: 'bg-orange-100',
                   border: 'border-orange-100/50'
                 },
                 teal: {
                   line: 'before:bg-teal-200',
                   dot: 'bg-teal-500',
                   badgeText: 'text-teal-600',
                   badgeBg: 'bg-teal-100',
                   border: 'border-teal-100/50'
                 },
                 blue: {
                   line: 'before:bg-blue-200',
                   dot: 'bg-blue-500',
                   badgeText: 'text-blue-600',
                   badgeBg: 'bg-blue-100',
                   border: 'border-blue-100/50'
                 },
                 purple: {
                   line: 'before:bg-purple-200',
                   dot: 'bg-purple-500',
                   badgeText: 'text-purple-600',
                   badgeBg: 'bg-purple-100',
                   border: 'border-purple-100/50'
                 },
                 pink: {
                   line: 'before:bg-pink-200',
                   dot: 'bg-pink-500',
                   badgeText: 'text-pink-600',
                   badgeBg: 'bg-pink-100',
                   border: 'border-pink-100/50'
                 }
               };
               const style = colorStyles[color];

               return (
                <div key={log.id} className={`relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:w-[2px] before:h-full ${style.line} last:before:h-0`}>
                  <div className={`absolute left-1 top-1.5 w-2.5 h-2.5 ${style.dot} rounded-full ring-4 ring-[#FAEEE4]`}></div>
                  <div className="flex justify-between items-center mb-1 text-xs text-gray-500 font-medium">
                    <span>{timeStr}</span>
                    <span className={`${style.badgeText} ${style.badgeBg} px-2 rounded`}>Aayu AI</span>
                  </div>
                  <div className={`bg-white p-3 rounded-xl shadow-sm border ${style.border} mt-2`}>
                    <p className="text-sm text-gray-700 font-medium">{title}</p>
                    <p className="text-xs text-gray-500 mt-1">{desc}</p>
                  </div>
                </div>
               );
            })}
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

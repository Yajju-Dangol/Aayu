import { ArrowRight, Heart, Activity, Brain, ShieldCheck, Mic, FileText, Smartphone, LayoutDashboard, Globe, Zap, Database } from 'lucide-react';
import { supabase } from './lib/supabase';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Error logging in with Google');
    }
  };

  return (
    <div className="bg-[#FDF8F3] min-h-screen text-gray-900 font-sans selection:bg-[#E2FF66] selection:text-black overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 max-w-7xl mx-auto relative z-50">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tighter text-gray-900">AAYU <span className="text-purple-600">(आयु)</span></span>
        </div>
        <div className="hidden md:flex items-center space-x-10 font-bold text-sm uppercase tracking-widest text-gray-500">
          <a href="#vision" className="hover:text-purple-600 transition-colors">Vision</a>
          <a href="#agents" className="hover:text-purple-600 transition-colors">Agents</a>
          <a href="#tech" className="hover:text-purple-600 transition-colors">Tech</a>
          <a href="#ui" className="hover:text-purple-600 transition-colors">UI</a>
        </div>
        <button 
          onClick={handleGoogleLogin}
          className="bg-gray-900 text-white font-bold px-8 py-3 rounded-2xl hover:bg-purple-600 transition-all shadow-xl hover:shadow-purple-200"
        >
          LOG IN
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Hero Section */}
        <section className="pt-12 md:pt-20 pb-24 flex flex-col items-center text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-100/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-purple-100 mb-8"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Voice-First Nepali AI Doctor</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black leading-none mb-8 tracking-tighter"
          >
            Empowering Life Through <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400">Simple Conversation.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed"
          >
            Project Aayu (Sanskrit for "Life") is designed to help elderly people manage their health, 
            medicine, and diet through the most natural interface: their voice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button 
              onClick={handleGoogleLogin}
              className="bg-purple-600 text-white font-black text-lg px-12 py-5 rounded-[2rem] shadow-2xl shadow-purple-200 hover:bg-purple-700 hover:scale-105 transition-all flex items-center space-x-3 group"
            >
              <span>GET STARTED</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>

          {/* Floating Elements Decoration */}
          <div className="absolute top-1/4 left-0 hidden lg:block animate-bounce" style={{ animationDuration: '3s' }}>
             <Heart className="w-12 h-12 text-pink-400 opacity-40 rotate-12" strokeWidth={1} />
          </div>
          <div className="absolute top-1/3 right-0 hidden lg:block animate-bounce" style={{ animationDuration: '4s' }}>
             <Activity className="w-16 h-16 text-purple-400 opacity-40 -rotate-12" strokeWidth={1} />
          </div>
        </section>

        {/* The Vision section */}
        <section id="vision" className="mb-32 relative">
          <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-xl border border-purple-50 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            <div className="flex-1 z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                The Vision: <br/> 
                <span className="text-purple-600">A Digital Companion.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                In Nepal, many elderly parents live alone while their children work in cities or abroad. 
                <strong> Aayu</strong> acts as a 24/7 digital companion that speaks their language, remembers their medical history, 
                and alerts their family if something is wrong.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-sm font-bold text-gray-700 italic">"Speaking their language natively."</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <p className="text-sm font-bold text-gray-700 italic">"24/7 watchful eye for safety."</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-md">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <img 
                  src="/assets/aama_using_aayu.png" 
                  alt="Nepali Grandmother using Aayu" 
                  className="relative rounded-[2rem] w-full h-80 object-cover shadow-2xl border-4 border-white"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3-Agent System */}
        <section id="agents" className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">The "Brains"</h2>
            <p className="text-gray-500 text-lg">A 3-Agent System working together like a hospital team.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Interviewer */}
            <motion.div whileHover={{ y: -10 }} className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-purple-50 relative overflow-hidden group">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Mic className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-4">The Interviewer</h3>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">The Face</p>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                  <span className="text-sm">Talks to the patient in <strong>respectful Nepali</strong> (Hajur/Tapai).</span>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                  <span className="text-sm">Uses phone camera to <strong>identify medicine</strong> strips or food.</span>
                </li>
              </ul>
            </motion.div>

            {/* Clinical Analyst */}
            <motion.div whileHover={{ y: -10 }} className="bg-gray-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-4">The Clinical Analyst</h3>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">The Expert</p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                  <span className="text-sm">Reads long, complicated <strong>hospital PDF reports</strong> instantly.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                  <span className="text-sm">Cross-checks vitals with doctor's notes for <strong>safe advice</strong>.</span>
                </li>
              </ul>
            </motion.div>

            {/* Guardian */}
            <motion.div whileHover={{ y: -10 }} className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-purple-50 relative overflow-hidden group">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-4">The Guardian</h3>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">The Sentinel</p>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-4 h-4 text-orange-400 mt-1 shrink-0" />
                  <span className="text-sm">Never sleeps. Watches patient data <strong>24/7</strong> for anomalies.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <ArrowRight className="w-4 h-4 text-orange-400 mt-1 shrink-0" />
                  <span className="text-sm">Sends <strong>WhatsApp alerts</strong> if vitals are too high or meds missed.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Technology */}
        <section id="tech" className="mb-32">
          <div className="bg-[#E2FF66] rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/20 rounded-full"></div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-16 relative z-10">The Technology</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6 text-purple-700" />
                  <h4 className="text-xl font-bold">Gemini 1.5 Flash Live</h4>
                </div>
                <p className="text-gray-800 font-medium">The latest AI from Google allows instant voice conversation with zero awkward delays. It feels like a real call.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-purple-700" />
                  <h4 className="text-xl font-bold">Supabase Memory</h4>
                </div>
                <p className="text-gray-800 font-medium">Secure health data storage using "Vector Search" to find specific medical facts from years of history in seconds.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-purple-700" />
                  <h4 className="text-xl font-bold">Edge Functions</h4>
                </div>
                <p className="text-gray-800 font-medium">Small bits of code acting as a lightning-fast "bridge" between the AI's pulse and the secure database.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Look / Design */}
        <section id="ui" className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 italic tracking-tighter">Adaptive Design</h2>
            <p className="text-gray-500 text-lg">One app, two distinct experiences tailored for specific needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* For the Patient */}
            <div className="bg-white rounded-[3rem] p-4 shadow-xl border border-purple-50 group overflow-hidden">
              <div className="bg-purple-50 p-8 rounded-[2.5rem] h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-6 h-6 text-purple-600" />
                    <span className="font-black uppercase tracking-widest text-xs">Elderly View</span>
                  </div>
                  <div className="w-3 h-3 bg-purple-600 rounded-full animate-ping"></div>
                </div>
                
                <h3 className="text-3xl font-black mb-6">Interface for the Elderly</h3>
                <ul className="space-y-6 mb-10">
                  <li className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    </div>
                    <span className="font-bold text-gray-700">One Big Pulsating Button</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                      <span className="font-black text-purple-600 text-sm">क</span>
                    </div>
                    <span className="font-bold text-gray-700">Live Nepali Translation</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-4 bg-green-400 rounded-full"></div>
                        <div className="w-2 h-4 bg-red-400 rounded-full"></div>
                      </div>
                    </div>
                    <span className="font-bold text-gray-700">Large Visual Health Cards</span>
                  </li>
                </ul>
                <div className="mt-auto relative w-full h-48 bg-white rounded-2xl border-2 border-dashed border-purple-200 flex items-center justify-center overflow-hidden">
                   <img 
                     src="/assets/buba_using_aayu.png" 
                     alt="Nepali Grandfather talking to Aayu" 
                     className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-80"
                   />
                   <div className="relative w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center animate-pulse z-10 shadow-xl">
                      <Mic className="w-10 h-10 text-white" />
                   </div>
                </div>
              </div>
            </div>

            {/* For the Caretaker */}
            <div className="bg-gray-900 rounded-[3rem] p-4 shadow-xl border border-gray-800 group overflow-hidden">
              <div className="bg-gray-800 p-8 rounded-[2.5rem] h-full flex flex-col text-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className="w-6 h-6 text-purple-400" />
                    <span className="font-black uppercase tracking-widest text-xs text-gray-400">Caretaker Dashboard</span>
                  </div>
                </div>
                
                <h3 className="text-3xl font-black mb-6">Expert Oversight</h3>
                <ul className="space-y-6 mb-10 text-gray-300">
                  <li className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full shadow-sm flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-bold">Granular Health Charts</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full shadow-sm flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-bold">Agent Logic Feed (Transparency)</span>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full shadow-sm flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-bold">Real-time Emergency Triggers</span>
                  </li>
                </ul>
                <div className="mt-auto relative w-full h-40 bg-gray-900 rounded-2xl border-2 border-dashed border-gray-700 p-4">
                   <div className="flex space-x-2 items-end h-full">
                      <div className="bg-purple-600 w-full rounded-t-lg h-1/2"></div>
                      <div className="bg-purple-400 w-full rounded-t-lg h-3/4"></div>
                      <div className="bg-purple-500 w-full rounded-t-lg h-1/3"></div>
                      <div className="bg-purple-300 w-full rounded-t-lg h-full"></div>
                      <div className="bg-purple-600 w-full rounded-t-lg h-2/3"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Banner */}
        <section className="bg-purple-600 rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden mb-24">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
           
           <h2 className="text-4xl md:text-6xl font-black mb-12 relative z-10 leading-tight">
             Join the Future of <br/> Elderly Healthcare.
           </h2>
           
           <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
              <button 
                onClick={handleGoogleLogin}
                className="bg-white text-purple-600 font-black text-xl px-12 py-5 rounded-[2rem] shadow-2xl hover:scale-105 transition-all w-full md:w-auto"
              >
                START FOR FREE
              </button>
              <button className="bg-purple-700/50 backdrop-blur-md text-white border-2 border-white/20 font-black text-xl px-12 py-5 rounded-[2rem] hover:bg-purple-700 transition-all w-full md:w-auto">
                CONTACT US
              </button>
           </div>
        </section>

      </main>
      
      <footer className="max-w-7xl mx-auto px-10 py-16 flex flex-col md:flex-row items-center justify-between border-t border-purple-100">
         <div className="flex items-center space-x-2 mb-8 md:mb-0">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center rotate-3 shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter">AAYU <span className="text-purple-600">PRO</span></span>
         </div>
         
         <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm font-bold uppercase tracking-widest text-gray-500">
           <a href="#vision" className="hover:text-purple-600">Vision</a>
           <a href="#agents" className="hover:text-purple-600">Agents</a>
           <a href="#tech" className="hover:text-purple-600">Technology</a>
           <a href="#" className="hover:text-purple-600">Privacy Policy</a>
         </div>

         <div className="mt-8 md:mt-0 text-gray-400 text-xs font-medium">
           &copy; 2026 Project Aayu. Built with Gemini AI.
         </div>
      </footer>
    </div>
  );
}

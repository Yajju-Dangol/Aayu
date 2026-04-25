import { ArrowRight, Heart, Activity, Brain, ShieldCheck, Mic, FileText, Smartphone, LayoutDashboard, Globe, Zap, Database, Pill, Coffee, Droplets, Thermometer, Smile, Users, Search, ClipboardCheck } from 'lucide-react';
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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Offset for the sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-[#F9FAF8] min-h-screen text-[#1F2917] font-sans selection:bg-[#395422] selection:text-white overflow-x-hidden">

      {/* Navigation */}
      <nav className="sticky top-0 bg-[#F9FAF8]/80 backdrop-blur-md z-50 border-b border-[#E0E5DA]/50">
        <div className="flex items-center justify-between px-6 md:px-10 py-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/aayu-logo.svg" alt="Aayu Logo" className="h-16 w-auto" />
            <span className="font-extrabold text-2xl tracking-tighter text-[#1F2917]">AAYU <span className="text-[#395422]">(आयु)</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-10 font-bold text-sm uppercase tracking-widest text-[#5C6B50]">
            <a href="#vision" onClick={(e) => scrollToSection(e, 'vision')} className="hover:text-[#395422] transition-colors">Vision</a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-[#395422] transition-colors">Features</a>
            <a href="#agents" onClick={(e) => scrollToSection(e, 'agents')} className="hover:text-[#395422] transition-colors">Agents</a>
            <a href="#tech" onClick={(e) => scrollToSection(e, 'tech')} className="hover:text-[#395422] transition-colors">Tech</a>
          </div>
          <button
            onClick={handleGoogleLogin}
            className="bg-[#1F2917] text-white font-bold px-8 py-3 rounded-2xl hover:bg-[#395422] transition-all shadow-xl shadow-black/5"
          >
            LOG IN
          </button>
        </div>
      </nav>


      <main className="max-w-7xl mx-auto px-6 md:px-10">

        {/* Hero Section */}
        <section className="pt-12 md:pt-20 pb-24 flex flex-col items-center text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-[#E0E5DA] mb-8"
          >
            <span className="w-2 h-2 bg-[#395422] rounded-full animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#395422]">Compassionate Nepali AI Healthcare</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black leading-none mb-8 tracking-tighter"
          >
            Empowering Life Through <br />
            <span className="text-[#395422]">Simple Conversation.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-[#5C6B50] mb-12 max-w-3xl leading-relaxed"
          >
            Our Solution: A compassionate AI health companion that listens, understands, and organizes your medical life—designed for Nepali.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              onClick={handleGoogleLogin}
              className="bg-[#395422] text-white font-black text-lg px-12 py-5 rounded-[2rem] shadow-2xl shadow-[#395422]/10 hover:bg-[#2D421B] hover:scale-105 transition-all flex items-center space-x-3 group"
            >
              <span>START FOR FREE</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </section>

        {/* The Problem & Solution section */}
        <section id="vision" className="mb-32 relative">
          <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-xl border border-[#F0F2ED] flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
            <div className="flex-1 z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                The Problem: <br />
                <span className="text-red-600/80">The Health Tracking Gap.</span>
              </h2>
              <p className="text-lg text-[#5C6B50] leading-relaxed mb-8">
                For many, managing chronic health feels like a full-time job. Data is scattered across paper reports, forgotten symptoms go unrecorded, and complex apps feel like a chore—especially for those who aren't tech-savvy.
              </p>
              <div className="p-8 bg-[#F9FAF8] rounded-[2rem] border border-[#E0E5DA]">
                <h3 className="font-bold text-2xl mb-4 text-[#395422]">Our Solution</h3>
                <p className="text-[#5C6B50] italic">
                  "A coordinated team of three AI agents that transform simple talk into life-saving insights, ensuring technology feels like a respectful companion, not a cold machine."
                </p>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md">
              <div className="relative group">
                <div className="absolute -inset-4 bg-[#395422]/5 rounded-[2.5rem] opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src="/assets/aama_using_aayu.png"
                  alt="Nepali Grandmother using Aayu"
                  className="relative rounded-[2rem] w-full h-80 object-cover shadow-2xl border-4 border-white"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Key Pillars Section */}
        <section id="features" className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-[#F0F2ED]">
              <div className="w-14 h-14 bg-[#F2F4EF] text-[#395422] rounded-2xl flex items-center justify-center mb-6">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-4">1. Human-First Interface</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="text-[#395422] font-bold">●</span>
                  <p className="text-sm text-gray-600"><strong>Talk, Don’t Type:</strong> Use real-time voice streaming to log your day. It feels like a phone call.</p>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-[#395422] font-bold">●</span>
                  <p className="text-sm text-gray-600"><strong>Culturally Connected:</strong> Fully localized in Nepali using respectful honorifics (Hajur/Tapai).</p>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-[#395422] font-bold">●</span>
                  <p className="text-sm text-gray-600"><strong>Visual Confirmation:</strong> Live transcription shows exactly what’s being recorded.</p>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-[#F0F2ED]">
              <div className="w-14 h-14 bg-[#F2F4EF] text-[#395422] rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-4">2. 360° Health Diary</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase"><Pill className="w-3 h-3" /> Meds</div>
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase"><Thermometer className="w-3 h-3" /> Vitals</div>
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase"><Coffee className="w-3 h-3" /> Energy</div>
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase"><Droplets className="w-3 h-3" /> Water</div>
              </div>
              <p className="text-sm text-gray-600">Captures every detail—from food data and symptoms to social interactions and emotional moods.</p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-[#F0F2ED]">
              <div className="w-14 h-14 bg-[#F2F4EF] text-[#395422] rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-4">3. Paper to Intelligence</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="text-[#395422] font-bold">●</span>
                  <p className="text-sm text-gray-600"><strong>Bridge:</strong> Upload PDF hospital reports and the AI automatically "reads" and remembers them.</p>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-[#395422] font-bold">●</span>
                  <p className="text-sm text-gray-600"><strong>Smart Search:</strong> Ask questions about your medical records and get instant answers.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* The Tri-Agent System */}
        <section id="agents" className="mb-32">
          <div className="bg-[#1F2917] rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-4">The Tri-Agent System</h2>
              <p className="text-gray-400 text-lg mb-16 max-w-2xl">Three specialized AI personas working in harmony to solve the complex problem of elderly health management.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-[#395422] rounded-2xl flex items-center justify-center">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Agent 1: The Compassionate Listener</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    The "Face" of Aayu. Handles fluid, back-and-forth Nepali talking. No buttons required. It silently triggers tools to log 9 critical health metrics while you chat.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="w-16 h-16 bg-[#395422] rounded-2xl flex items-center justify-center">
                    <ClipboardCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Agent 2: The Digital Registrar</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    The "Organizer". Works behind the scenes to turn messy talk into structured data. It populates your visual "Health Card" system and maintains a logic feed.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="w-16 h-16 bg-[#395422] rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Agent 3: The Health Guardian</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    The "Visionary". Analyzes long-term trends over months and connects the dots across your entire medical history to spot patterns a human might miss.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="tech" className="mb-32">
          <div className="bg-[#F0F2ED] rounded-[3rem] p-12 md:p-20 relative overflow-hidden border border-[#E0E5DA]">
            <h2 className="text-4xl md:text-5xl font-black mb-16 relative z-10 text-[#395422]">The Technology</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6 text-[#395422]" />
                  <h4 className="text-xl font-bold text-[#1F2917]">Gemini 3.1 Flash Live</h4>
                </div>
                <p className="text-[#5C6B50] font-medium">Powering the "Compassionate Listener" with zero-latency multimodal voice streaming.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-[#395422]" />
                  <h4 className="text-xl font-bold text-[#1F2917]">Supabase Vector</h4>
                </div>
                <p className="text-[#5C6B50] font-medium">The brain of the "Digital Registrar", organizing and searching through medical memory instantly.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-[#395422]" />
                  <h4 className="text-xl font-bold text-[#1F2917]">Gemini AI</h4>
                </div>
                <p className="text-[#5C6B50] font-medium">Handling the complex data to a simple understandable format.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Banner */}
        <section className="bg-[#395422] rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden mb-24 shadow-2xl shadow-[#395422]/20">
          <h2 className="text-4xl md:text-6xl font-black mb-12 relative z-10 leading-tight">
            Join the Future of <br /> Compassionate Healthcare.
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
            <button onClick={handleGoogleLogin} className="bg-white text-[#395422] font-black text-xl px-12 py-5 rounded-[2rem] shadow-2xl hover:scale-105 transition-all w-full md:w-auto">
              START FOR FREE
            </button>
            <button className="bg-[#1F2917] text-white border-2 border-white/10 font-black text-xl px-12 py-5 rounded-[2rem] hover:bg-[#1F2917]/80 transition-all w-full md:w-auto">
              CONTACT US
            </button>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-10 py-16 flex flex-col md:flex-row items-center justify-between border-t border-[#E0E5DA]">
        <div className="flex items-center space-x-2 mb-8 md:mb-0">
          <img src="/aayu-logo.svg" alt="Aayu Logo" className="h-12 w-auto" />
          <span className="font-black text-xl tracking-tighter text-[#1F2917]">AAYU</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm font-bold uppercase tracking-widest text-[#5C6B50]">
          <a href="#vision" onClick={(e) => scrollToSection(e, 'vision')} className="hover:text-[#395422]">Vision</a>
          <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-[#395422]">Features</a>
          <a href="#agents" onClick={(e) => scrollToSection(e, 'agents')} className="hover:text-[#395422]">Agents</a>
          <a href="#tech" onClick={(e) => scrollToSection(e, 'tech')} className="hover:text-[#395422]">Technology</a>
        </div>

        <div className="mt-8 md:mt-0 text-[#5C6B50]/50 text-xs font-medium">
          &copy; 2026 Project Aayu.
        </div>
      </footer>
    </div>
  );
}

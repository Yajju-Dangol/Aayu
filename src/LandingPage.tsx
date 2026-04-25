import { ArrowRight, ArrowUpRight, CheckCircle, Heart, Activity, Star, Users, Brain } from 'lucide-react';
import { supabase } from './lib/supabase';

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
    <div className="bg-white min-h-screen text-gray-900 font-sans selection:bg-[#E2FF66] selection:text-black">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-10 py-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Heart className="w-6 h-6 text-[#E2FF66] fill-[#E2FF66]" />
          <span className="font-bold text-xl uppercase tracking-wider">Aayu</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 font-medium text-sm text-gray-700">
          <a href="#" className="hover:text-black">Home</a>
          <a href="#" className="hover:text-black">Services</a>
          <a href="#" className="hover:text-black">Pricing</a>
          <a href="#" className="hover:text-black">About</a>
        </div>
        <button 
          onClick={handleGoogleLogin}
          className="bg-[#E2FF66] text-black font-semibold px-6 py-2 rounded-full hover:bg-[#d4f25b] transition-colors"
        >
          Join today
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-10 py-12">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-12 mb-24 relative">
          <div className="flex-1 max-w-lg">
            <h1 className="text-6xl font-bold leading-tight mb-6">
              Welcome <span className="text-[#E2FF66] tracking-tighter">▶▶▶</span><br/>
              To Aayu Health
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              At Aayu, we believe that health is the foundation of a fulfilling life. 
              Our mission is to inspire and empower individuals to achieve their health 
              goals in a supportive and energizing environment powered by AI.
            </p>
            <button 
              onClick={handleGoogleLogin}
              className="bg-[#7B61FF] text-white font-medium px-8 py-3 rounded-full shadow-lg shadow-purple-200 hover:bg-[#6A52E0] transition-colors"
            >
              Get Started with Google
            </button>
            <div className="mt-8 text-[#7B61FF]">
              <ArrowRight className="w-12 h-12 transform rotate-45 opacity-60" strokeWidth={1} />
            </div>
          </div>
          
          <div className="flex-1 relative">
             <div className="bg-[#EAD9FF] rounded-[3rem] p-8 aspect-square relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop" 
                  alt="Yoga/Health" 
                  className="rounded-full w-4/5 h-4/5 object-cover absolute top-10 right-10 shadow-lg border-8 border-white"
                />
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                   <div className="w-12 h-12 bg-[#7B61FF] rounded-xl flex items-center justify-center text-white text-2xl rotate-12">
                     *
                   </div>
                   <div className="text-right">
                     <p className="text-white text-xs font-medium bg-white/20 backdrop-blur px-4 py-2 rounded-full border border-white/30">
                       Read more
                     </p>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-[#E2FF66] rounded-[2rem] p-12 mb-24 relative overflow-hidden flex flex-col md:flex-row justify-around items-center text-center">
            <h2 className="absolute top-8 left-0 right-0 text-3xl font-bold z-10">Why Choose Us?</h2>
            
            {/* Background Wavy Line Decoration */}
            <svg className="absolute inset-0 w-full h-full text-[#cdeb4c] opacity-50" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
            </svg>

            <div className="relative z-10 mt-16 flex flex-col items-center">
               <Star className="w-8 h-8 text-[#7B61FF] fill-[#7B61FF] mb-4" />
               <h3 className="text-4xl font-bold mb-2">95%</h3>
               <p className="text-gray-800 font-medium text-sm">Member Satisfaction Rate</p>
            </div>
            
            <div className="relative z-10 mt-16 flex flex-col items-center">
               <Activity className="w-8 h-8 text-[#7B61FF] fill-[#7B61FF] mb-4" />
               <h3 className="text-4xl font-bold mb-2">80+</h3>
               <p className="text-gray-800 font-medium text-sm">Weekly Checkups</p>
            </div>

            <div className="relative z-10 mt-16 flex flex-col items-center">
               <Users className="w-8 h-8 text-[#7B61FF] fill-[#7B61FF] mb-4" />
               <h3 className="text-4xl font-bold mb-2">&gt;1,000</h3>
               <p className="text-gray-800 font-medium text-sm">Satisfied Patients</p>
            </div>
        </section>

        {/* Categories / Our Values */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold mb-10">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Inclusivity */}
             <div className="bg-[#EFD9FF] rounded-[2rem] p-8 relative flex flex-col h-80 transition-transform hover:-translate-y-2">
                <div className="absolute top-6 right-6 w-8 h-8 border border-black rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Inclusivity</h3>
                <p className="text-gray-700 text-sm">Welcoming everyone, regardless of health level.</p>
                <div className="mt-auto">
                   <div className="text-[#E2FF66] text-6xl">☼</div>
                </div>
             </div>

             {/* Innovation */}
             <div className="bg-[#E2FF66] rounded-[2rem] p-8 relative flex flex-col h-80 transition-transform hover:-translate-y-2">
                <div className="absolute top-6 right-6 w-8 h-8 border border-black rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Innovation</h3>
                <p className="text-gray-700 text-sm">Using the latest AI models and embedding techniques.</p>
                <div className="mt-auto flex gap-2">
                   <Brain className="w-16 h-16 text-[#7B61FF]" strokeWidth={1.5} />
                </div>
             </div>

             {/* Community */}
             <div className="bg-[#7B61FF] rounded-[2rem] p-8 relative flex flex-col h-80 text-white transition-transform hover:-translate-y-2">
                <div className="absolute top-6 right-6 w-8 h-8 border border-white rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="absolute -top-10 left-10 flex flex-col gap-2 opacity-50 text-xs">
                   <span className="bg-white text-[#7B61FF] px-3 py-1 rounded-full whitespace-nowrap">Voice active</span>
                   <span className="bg-pink-300 text-purple-900 px-3 py-1 rounded-full whitespace-nowrap -ml-4">Progress tracking</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 mt-4">Community</h3>
                <p className="text-purple-100 text-sm">Building a space where members support each other.</p>
                <div className="mt-auto">
                   <div className="text-white text-6xl opacity-90">*</div>
                </div>
             </div>
          </div>
        </section>

        {/* Footer Banner */}
        <section className="bg-[#EFD9FF] rounded-[2rem] p-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
           <div className="flex-1 shrink-0 z-10">
              <img 
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop" 
                alt="Trainer" 
                className="w-64 h-64 object-cover rounded-2xl shadow-xl"
              />
           </div>
           
           {/* SVG Decoration */}
           <svg className="absolute left-1/4 right-0 w-full h-full text-white opacity-40 z-0" viewBox="0 0 500 200" preserveAspectRatio="none">
             <path d="M0,100 C100,50 200,150 300,100 C400,50 500,150 600,100" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
           </svg>

           <div className="flex-1 z-10">
              <h2 className="text-4xl font-bold mb-8 text-black leading-tight">
                Get the latest updates, special offers and exclusive invitations to masterclasses!
              </h2>
              <div className="bg-white rounded-full p-2 flex border border-white/50 focus-within:border-purple-300 transition-colors max-w-md w-full">
                 <input 
                   type="email" 
                   placeholder="Email" 
                   className="flex-1 bg-transparent px-6 outline-none text-gray-700"
                 />
                 <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                   <ArrowRight className="w-5 h-5 text-gray-500" />
                 </button>
              </div>
              <p className="text-xs text-gray-500 mt-4 px-4">
                By signing up, you agree to the Terms and Conditions and Privacy Policy
              </p>
           </div>
        </section>

      </main>
      
      <footer className="max-w-7xl mx-auto px-10 py-8 flex flex-col md:flex-row items-center justify-between text-sm font-medium text-gray-600 border-t border-gray-100 mt-12">
         <div className="flex items-center space-x-2 text-black mb-4 md:mb-0">
          <Heart className="w-5 h-5 text-[#E2FF66] fill-[#E2FF66]" />
          <span className="font-bold text-lg uppercase tracking-wider">Aayu</span>
         </div>
         <div className="flex space-x-6">
           <a href="#" className="hover:text-black">Home</a>
           <a href="#" className="hover:text-black">Privacy policy</a>
           <a href="#" className="hover:text-black">Contact</a>
         </div>
      </footer>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { IconArrowRight, IconSparkles, IconMenu2, IconX } from '@tabler/icons-react';
import ScrollReveal from '@/components/Global/ScrollReveal';
import ParticlesBackground from '@/components/Global/Particles';
import { useRouter } from 'next/router';
import Footer from '@/components/Global/Footer';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenAuth = () => {
    router.push('/auth');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black relative overflow-hidden">
      {/* Particles Background */}
      <div className="absolute inset-0 z-0">
        <ParticlesBackground />
      </div>

      {/* Decorative Background Orbs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-2xl" />
      </div>

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 z-0 bg-grid opacity-30 mask-radial-faded" />

      {/* Navigation */}
      <nav className={`fixed top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-50 rounded-full w-[95%] sm:w-11/12 max-w-5xl ${isMobileMenuOpen ? 'bg-transparent border-transparent shadow-none backdrop-blur-0' : 'bg-black/30 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl'}`}>
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <img
                      src="/sa-logo.png"
                      alt="Gisma Agent Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-white">
                    Gisma Agent
                  </h1>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2">
                <a 
                  href="#features" 
                  className="px-3 sm:px-4 py-2 text-blue-200/80 hover:text-white hover:bg-blue-500/20 rounded-full text-sm font-medium transition-all duration-200"
                >
                  Features
                </a>
                <a 
                  href="#" 
                  className="px-3 sm:px-4 py-2 text-blue-200/80 hover:text-white hover:bg-blue-500/20 rounded-full text-sm font-medium transition-all duration-200"
                >
                  Pricing
                </a>
                <a 
                  href="#" 
                  className="px-3 sm:px-4 py-2 text-blue-200/80 hover:text-white hover:bg-blue-500/20 rounded-full text-sm font-medium transition-all duration-200"
                >
                  About
                </a>
              </div>
            </div>

            {/* Desktop Get Started Button */}
            <div className="hidden lg:block">
              <button 
                onClick={handleOpenAuth}
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-blue-200 hover:text-white hover:bg-blue-500/20 rounded-full transition-all duration-200"
              >
                {isMobileMenuOpen ? (
                  <IconX className="w-5 h-5" />
                ) : (
                  <IconMenu2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-2">
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl ring-1 ring-white/10 p-4 space-y-3">
                <a 
                  href="#features" 
                  className="block px-4 py-3 text-blue-200 hover:text-white hover:bg-blue-500/20 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-3 text-blue-200 hover:text-white hover:bg-blue-500/20 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-3 text-blue-200 hover:text-white hover:bg-blue-500/20 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </a>
                <button 
                  onClick={() => {
                    handleOpenAuth();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-28 sm:pt-36 md:pt-24 pb-12 sm:pb-16 lg:pt-32 lg:pb-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ScrollReveal direction="up" delay={300} duration={1000}>
              <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-blue-900/40 text-blue-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 ring-1 ring-white/10">
                <IconSparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Gisma AI Assistant
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={700} duration={1000}>
              <div className="relative inline-block">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-6 left-1/4 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-blue-500/30 blur-3xl animate-pulse" />
                  <div className="absolute top-1/3 -right-6 w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-indigo-500/25 blur-3xl animate-pulse delay-150" />
                  <div className="absolute -bottom-8 right-1/3 w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-cyan-400/25 blur-3xl animate-pulse delay-300" />
                  <div className="absolute bottom-0 left-0 w-56 h-12 sm:w-72 sm:h-16 rounded-full bg-blue-400/20 blur-[60px]" />
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-6xl tracking-tight font-bold text-white mb-6 sm:mb-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-2xl transform hover:scale-105 transition-all duration-300 relative z-10 overflow-hidden animate-float">
                  <span className="block leading-[1.2] sm:leading-[1.3] mb-1 sm:mb-2 md:mb-3 relative z-10">Unified Data Platform</span>
                  <span className="block leading-[1.2] sm:leading-[1.3] bg-gradient-to-r from-blue-100 to-blue-200 bg-clip-text text-transparent relative z-10">
                    of Fruits
                  </span>
                </h1>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={1000} duration={1000}>
              <p className="mt-6 sm:mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-blue-200 leading-relaxed px-4">
                Gisma is the data platform of Fruits, providing API services across multiple netwroks.
              </p>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={1100} duration={1000}>
              <div className="mt-8 sm:mt-10 max-w-md mx-auto sm:flex sm:justify-center lg:mt-12 px-4">
                <div className="rounded-xl w-full">
                  <button 
                    onClick={handleOpenAuth}
                    className="w-full flex items-center justify-center px-5 sm:px-8 py-3 sm:py-4 bg-transparent text-white text-sm sm:text-base lg:text-lg font-medium rounded-xl hover:scale-105 transition-all duration-300 border-2 border-blue-400/50 hover:border-blue-300 relative overflow-hidden group shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(99,102,241,0.45)] cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 via-transparent to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Get Started</span>
                    <IconArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={1500} duration={1000}>
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                Powerful Data Platform Features
              </h2>
              <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-blue-200">
                Everything you need to manage data across multiple networks and API patterns
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 sm:mt-16">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <ScrollReveal direction="up" delay={200} duration={1000}>
                <div className="group relative rounded-2xl">
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-400/30 via-transparent to-indigo-400/30 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/10 group-hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-4 sm:mb-6 shadow-lg">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                      Multi-Network API Services
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-sm sm:text-base">
                      Connect and manage data across multiple networks with unified API services and intelligent routing.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 2 */}
              <ScrollReveal direction="up" delay={400} duration={1000}>
                <div className="group relative rounded-2xl">
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-400/30 via-transparent to-indigo-400/30 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/10 group-hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-4 sm:mb-6 shadow-lg">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                      REST & GraphQL APIs
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-sm sm:text-base">
                      Flexible API patterns supporting both REST and GraphQL endpoints for diverse integration needs.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Feature 3 */}
              <ScrollReveal direction="up" delay={600} duration={1000}>
                <div className="group relative rounded-2xl">
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-400/30 via-transparent to-indigo-400/30 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/10 group-hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-4 sm:mb-6 shadow-lg">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                      Intelligent Data Management
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-sm sm:text-base">
                      Advanced data processing, transformation, and analytics capabilities powered by AI for optimal performance.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* No modal; navigation to /auth */}
    </div>
  );
};

export default HomePage; 
import React from 'react';
import ScrollReveal from '@/components/Global/ScrollReveal';

const Footer: React.FC = () => {
  return (
    <ScrollReveal direction="up" delay={0} duration={1000}>
      <footer className="relative z-10 border-t border-white/10 overflow-hidden">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          {/* Base gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-slate-900/70 to-transparent" />
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-grid opacity-20" />
          {/* Organic glow blobs */}
          <div className="absolute -top-10 left-1/4 w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute -top-6 right-1/5 w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-40 h-16 sm:w-64 sm:h-24 rounded-full bg-cyan-400/20 blur-[60px]" />
          {/* Highlight line at the top edge */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-lg overflow-hidden">
                <img
                  src="/sa-logo.png"
                  alt="Gisma Agent Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-white">Gisma Agent</span>
            </div>
            <p className="text-blue-300 text-sm sm:text-base">© 2026 Gisma Agent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </ScrollReveal>
  );
};

export default Footer;


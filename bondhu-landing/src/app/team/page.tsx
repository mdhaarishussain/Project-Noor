'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Mail, Globe, ArrowRight, Sparkles, Menu, X, Moon, Sun } from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  role?: string;
  bio?: string;
  image: string;
  social: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    email?: string;
    website?: string;
  };
}

export default function TeamPage() {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const mentor: TeamMember = {
    id: 0,
    name: "Saikat Bandopadhyay",
    role: "Mentor & Advisor",
    bio: "Guiding the team with wisdom and experience ensuring that Bondhu AI remains thoughtful, ethical and impactful.",
    image: "https://media.licdn.com/dms/image/v2/D4D03AQGP9v5yuHuq-Q/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1691751398267?e=1762992000&v=beta&t=fQ3RsMP1dQ4VNH1koN66ITeCZoTTcE6MSiyLRc4ZAy4",
    social: { 
      linkedin: "https://www.linkedin.com/in/saikatbandopadhyay91/"
    }
  };

  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Md Haaris Hussain",
      image: "https://media.licdn.com/dms/image/v2/D4D03AQGGxOtHOAvILg/profile-displayphoto-scale_200_200/B4DZj3N_egGkAY-/0/1756494299147?e=1762992000&v=beta&t=y0aEiN53-0TXhm1dCi6a2NByfXVzx529hq00LUg6g_Y",
      social: { 
        linkedin: "https://www.linkedin.com/in/md-haaris-hussain-a69742253/",
        github: "https://github.com/mdhaarishussain"
      }
    },
    {
      id: 2,
      name: "Raquib",
      image: "https://media.licdn.com/dms/image/v2/D5603AQFzB1n6wl_iPw/profile-displayphoto-scale_200_200/B56Ze1NFFFHEAc-/0/1751091795417?e=1762992000&v=beta&t=hUCMlNgvgiMK_gJwIPFmDrmPCQ4vWIOMSHX8NaLoPBo",
      social: { 
        linkedin: "https://www.linkedin.com/in/raquib223/",
        github: "https://github.com/rex223"
      }
    },
    {
      id: 3,
      name: "Shaikh Ahmad",
      image: "https://media.licdn.com/dms/image/v2/D5603AQFZfKsZIq7gQg/profile-displayphoto-scale_200_200/B56ZnaW60NKMAY-/0/1760305128540?e=1762992000&v=beta&t=z0ncV9IgeNaIDIVA9nDHM3Zub8xS9p7mKfxF4PLPaIA",
      social: { 
        linkedin: "https://www.linkedin.com/in/shaikhahmad0968/",
        github: "https://github.com/shaikhahmad0968"
      }
    },
    {
      id: 4,
      name: "Md Adinul Arfin",
      image: "https://media.licdn.com/dms/image/v2/D5603AQG2mrgL0OMytg/profile-displayphoto-shrink_200_200/B56ZaxIcEnGkAY-/0/1746728503565?e=1762992000&v=beta&t=WlsqInm7yTYcja9YYVNyi6dtmTm-0ZeQ9rk1wcszQ90",
      social: { 
        linkedin: "https://www.linkedin.com/in/md-adinul-arfin-ba15b3208/",
      }
    },
    {
      id: 5,
      name: "Nawal Fida Laskar",
      image: "https://media.licdn.com/dms/image/v2/D4E35AQFgmpQATMY4yw/profile-framedphoto-shrink_200_200/B4EZncOyG6KYAY-/0/1760336487584?e=1760943600&v=beta&t=H7HDkviieSfDbopSb2NmLpJLCGlJgcyq59QbQ1nvVpg",
      social: { 
        linkedin: "https://www.linkedin.com/in/nawal-fida-laskar-48b6a52bb/",
      }
    }
  ];

  const stats = [
    { value: "24/7", label: "Always Available", color: "from-emerald-600 to-teal-600" },
    { value: "100%", label: "Confidential", color: "from-blue-600 to-indigo-600" },
    { value: "0", label: "Judgment", color: "from-slate-600 to-gray-600" },
    { value: "∞", label: "Support", color: "from-violet-600 to-purple-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden transition-colors duration-500">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[600px] h-[600px] bg-blue-200/30 dark:bg-blue-600/20 rounded-full blur-3xl -top-48 -left-48 transition-colors duration-500"
          style={{
            transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-600/20 rounded-full blur-3xl -bottom-48 -right-48 transition-colors duration-500"
          style={{
            transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40 dark:opacity-20" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 z-50 shadow-sm transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/" className="flex items-center group cursor-pointer">
                <img 
                  src="/Light mode logo.svg" 
                  alt="Bondhu" 
                  className="h-14 w-auto object-contain dark:hidden"
                />
                <img 
                  src="/Dark mode logo.svg" 
                  alt="Bondhu" 
                  className="h-14 w-auto object-contain hidden dark:block"
                />
              </a>
            </div>  

            <div className="flex items-center space-x-2">
              <nav className="hidden md:flex items-center space-x-1">
                <a
                  href="/"
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  Home
                </a>
                <a
                  href="/team"
                  className="px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                >
                  Team
                </a>
              </nav>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-700" />
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden mt-3 pb-2 space-y-2">
              <a
                href="/"
                className="block px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/team"
                className="block px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Team
              </a>
            </nav>
          )}
        </div>
      </header>

      <div className="h-[72px]"></div>

      {/* Hero Section */}
      <section 
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <div className="flex flex-col items-center gap-6 sm:gap-12">
          {/* Badge */}
          <div 
            className="inline-block opacity-0"
            style={{
              animation: 'appear 0.5s ease-out 0.1s forwards'
            }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-indigo-200 dark:border-indigo-700 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Meet Our Team
              </span>
            </div>
          </div>
          
          {/* Title */}
          <h1 
            className="relative z-10 text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-slate-100 leading-tight opacity-0"
            style={{
              animation: 'appear 0.5s ease-out 0.2s forwards',
              fontFamily: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif'
            }}
          >
            The Last
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
              Neuron
            </span>
          </h1>
          
          {/* Description */}
          <p 
            className="relative z-10 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed opacity-0"
            style={{
              animation: 'appear 0.5s ease-out 0.3s forwards'
            }}
          >
            We're a diverse team of 4th year students from NSEC united by one mission: making AI accessible and effective for everyone who needs it.
          </p>

          {/* Stats Grid */}
          <div 
            className="flex flex-wrap justify-center gap-4 mb-12 opacity-0"
            style={{
              animation: 'appear 0.5s ease-out 0.4s forwards'
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-500 hover:scale-105"
                style={{
                  animation: `appear 0.5s ease-out ${0.5 + index * 0.1}s forwards`,
                  opacity: 0
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`} />
                <div className={`text-3xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Glow Effect */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-indigo-500/20 via-blue-500/10 to-transparent dark:from-indigo-500/30 dark:via-blue-500/20 rounded-full blur-3xl pointer-events-none opacity-0"
          style={{
            animation: 'appear-zoom 0.5s ease-out 0.8s forwards'
          }}
        />
      </section>

      {/* Mentor Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200 dark:border-purple-700 rounded-full shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Our Guiding Light
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100">
            Meet Our <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Mentor</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div
            className="group relative"
            style={{
              animation: 'fadeInUp 0.8s ease-out forwards, mentorGlow 3s ease-in-out infinite',
              opacity: 0
            }}
            onMouseEnter={() => setHoveredMember(mentor.id)}
            onMouseLeave={() => setHoveredMember(null)}
          >
            <div 
              className="relative bg-white dark:bg-slate-800 backdrop-blur-sm rounded-3xl overflow-hidden border-2 border-purple-200 dark:border-purple-700 transition-all duration-500 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-purple-500/30 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-indigo-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:via-indigo-500/10 group-hover:to-blue-500/10 dark:group-hover:from-purple-500/20 dark:group-hover:via-indigo-500/20 dark:group-hover:to-blue-500/20 transition-all duration-500 z-0" />
              
              <div className="grid md:grid-cols-5 gap-6 p-8">
                <div className="md:col-span-2 relative">
                  <div className="relative overflow-hidden rounded-2xl aspect-square">
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />
                    
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-purple-500 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                    
                    <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-transparent flex items-end justify-center pb-5 transition-all duration-500 pointer-events-none z-50 ${
                      hoveredMember === mentor.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                      <div className="flex gap-2 pointer-events-auto z-50">
                        {mentor.social.linkedin && (
                          <a
                            href={mentor.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/icon bg-white/95 hover:bg-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-12 cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-col justify-center relative z-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200 dark:border-purple-700 rounded-full mb-4 w-fit">
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">MENTOR</span>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:via-indigo-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                    {mentor.name}
                  </h3>
                  
                  <p className="text-purple-600 dark:text-purple-400 font-bold mb-4 text-lg">
                    {mentor.role}
                  </p>
                  
                  <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-6">
                    {mentor.bio}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-full text-purple-700 dark:text-purple-300 text-sm font-semibold">
                      🎯 Strategic Vision
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
                      💡 Innovation Leader
                    </div>
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full text-blue-700 dark:text-blue-300 text-sm font-semibold">
                      🌟 Team Inspiration
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100">
            Our <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Team Members</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              className="group relative"
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: 'fadeInUp 0.8s ease-out forwards',
                opacity: 0
              }}
              onMouseEnter={() => setHoveredMember(member.id)}
              onMouseLeave={() => setHoveredMember(null)}
            >
              <div 
                className="relative bg-white dark:bg-slate-800 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-500 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-blue-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-blue-500/5 group-hover:to-indigo-500/5 dark:group-hover:from-indigo-500/10 dark:group-hover:via-blue-500/10 dark:group-hover:to-indigo-500/10 transition-all duration-500 z-0" />
                
                <div className="relative overflow-hidden aspect-square">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-transparent flex items-end justify-center pb-5 transition-all duration-500 pointer-events-none z-50 ${
                    hoveredMember === member.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <div className="flex gap-2 pointer-events-auto z-50">
                      {member.social.linkedin && (
                        <a
                          href={member.social.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/icon bg-white/95 hover:bg-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-12 cursor-pointer"
                        >
                          <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                      {member.social.github && (
                        <a
                          href={member.social.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/icon bg-white/95 hover:bg-white p-2.5 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-12 cursor-pointer"
                        >
                          <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative p-4 z-20 text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    {member.name}
                  </h3>
                </div>

                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 backdrop-blur-xl border-y border-slate-200/60 dark:border-slate-700/60 py-16 md:py-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gradient-to-br from-indigo-200/20 to-blue-200/20 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-gradient-to-tr from-purple-200/20 to-indigo-200/20 dark:from-purple-500/10 dark:to-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 border border-indigo-200 dark:border-indigo-700 rounded-full mb-2 md:mb-4 shadow-sm">
                <Heart className="w-4 md:w-5 h-4 md:h-5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                <span className="text-xs md:text-sm font-bold text-indigo-700 dark:text-indigo-300">Our Mission</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                Redefining
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Self-understanding
                </span>
              </h2>
              
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                At bondhu.tech, we believe everyone deserves a companion who listens without judgment, 
                understands without prejudice, and supports without limits.
              </p>
              
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                We're building Agentic AI-powered digital twin that's always there when you need it, designed to make emotional well-being more human and meaningful,
                combining cutting-edge technology with genuine empathy and care.
              </p>

              <a 
                href="/"
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 rounded-full text-white font-bold text-base md:text-lg hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 group mt-2 md:mt-4"
              >
                Explore Bondhu
                <ArrowRight className="w-5 md:w-6 h-5 md:h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="group overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-600 p-6 md:p-8 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-200/30 dark:hover:shadow-indigo-500/20"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-2 md:mb-3`}>
                      {stat.value}
                    </div>
                    <div className="text-slate-700 dark:text-slate-200 font-bold text-sm md:text-base">{stat.label}</div>
                  </div>
                  <div className="absolute top-3 md:top-4 right-3 md:right-4 w-16 md:w-20 h-16 md:h-20 bg-indigo-100/50 dark:bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-200/70 dark:group-hover:bg-indigo-400/30 transition-all duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4 group cursor-pointer">
            <Heart className="w-7 h-7 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-blue-600 dark:from-indigo-300 dark:to-blue-400 bg-clip-text text-transparent">
              bondhu.tech
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
            Your mental health companion, always here for you.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2025 Bondhu.tech. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes appear {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes appear-zoom {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes mentorGlow {
          0%, 100% { 
            filter: drop-shadow(0 0 0px rgba(168, 85, 247, 0));
          }
          50% { 
            filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.3));
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
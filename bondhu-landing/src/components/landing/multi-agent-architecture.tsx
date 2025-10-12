'use client';

import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useState, useCallback, useRef } from 'react';
import * as lucide from 'lucide-react';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { OceanModelModal } from './ocean-model-modal';

export default function MultiAgentArchitecture() {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
  const [isOceanModalOpen, setIsOceanModalOpen] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const agents = [
    {
      id: 1,
      name: 'Personality Agent',
      icon: 'Brain',
      color: 'emerald',
      iconWrapperClass: 'w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center',
      iconClass: 'w-7 h-7 text-emerald-600',
      checkIconClass: 'w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0',
      flowLineClass: 'bg-emerald-400',
      profileBadgeClass: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg p-3 border border-emerald-500/20',
      dotClass: 'w-2 h-2 rounded-full bg-emerald-400',
      particleClass: 'absolute w-2 h-2 rounded-full bg-emerald-500 hidden lg:block',
      mobileIconWrapperClass: 'w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0',
      mobileIconClass: 'w-6 h-6 text-emerald-600',
      source: 'Test Data',
      sourceIcon: 'ClipboardList',
      features: ['Core traits & values', 'Social preferences', 'Decision-making style'],
      showLiveIndicator: true,
    },
    {
      id: 2,
      name: 'Music Agent',
      icon: 'Music',
      color: 'green',
      iconWrapperClass: 'w-14 h-14 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center',
      iconClass: 'w-7 h-7 text-green-600',
      checkIconClass: 'w-4 h-4 text-green-400 mt-0.5 flex-shrink-0',
      flowLineClass: 'bg-green-400',
      profileBadgeClass: 'bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-3 border border-green-500/20',
      dotClass: 'w-2 h-2 rounded-full bg-green-400',
      particleClass: 'absolute w-2 h-2 rounded-full bg-green-500 hidden lg:block',
      mobileIconWrapperClass: 'w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center flex-shrink-0',
      mobileIconClass: 'w-6 h-6 text-green-600',
      source: 'Spotify',
      sourceIcon: 'spotify',
      features: ['Emotional expression', 'Energy & tempo patterns', 'Cultural influences'],
    },
    {
      id: 3,
      name: 'Content Agent',
      icon: 'Video',
      color: 'teal',
      iconWrapperClass: 'w-14 h-14 rounded-lg bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center',
      iconClass: 'w-7 h-7 text-teal-600',
      checkIconClass: 'w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0',
      flowLineClass: 'bg-teal-400',
      profileBadgeClass: 'bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-lg p-3 border border-teal-500/20',
      dotClass: 'w-2 h-2 rounded-full bg-teal-400',
      particleClass: 'absolute w-2 h-2 rounded-full bg-teal-500 hidden lg:block',
      mobileIconWrapperClass: 'w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center flex-shrink-0',
      mobileIconClass: 'w-6 h-6 text-teal-600',
      source: 'YouTube',
      sourceIcon: 'youtube',
      features: ['Learning preferences', 'Curiosity domains', 'Entertainment style'],
    },
    {
      id: 4,
      name: 'Gaming Agent',
      icon: 'Gamepad2',
      color: 'lime',
      iconWrapperClass: 'w-14 h-14 rounded-lg bg-gradient-to-br from-lime-500/20 to-lime-600/20 flex items-center justify-center',
      iconClass: 'w-7 h-7 text-lime-600',
      checkIconClass: 'w-4 h-4 text-lime-400 mt-0.5 flex-shrink-0',
      flowLineClass: 'bg-lime-400',
      profileBadgeClass: 'bg-gradient-to-br from-lime-500/20 to-lime-600/20 rounded-lg p-3 border border-lime-500/20',
      dotClass: 'w-2 h-2 rounded-full bg-lime-400',
      particleClass: 'absolute w-2 h-2 rounded-full bg-lime-500 hidden lg:block',
      mobileIconWrapperClass: 'w-12 h-12 rounded-lg bg-gradient-to-br from-lime-500/20 to-lime-600/20 flex items-center justify-center flex-shrink-0',
      mobileIconClass: 'w-6 h-6 text-lime-600',
      source: 'Gaming Data',
      sourceIcon: 'Gamepad2',
      features: ['Problem-solving approach', 'Competitive vs. cooperative', 'Risk tolerance'],
      comingSoon: true,
    },
  ];

  const handleHoverStart = useCallback((id: number) => {
    setHoveredAgent(id);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredAgent(null);
  }, []);

  const renderIcon = (iconName: string, className: string) => {
    const Icon = (lucide as any)[iconName];
    return Icon ? <Icon className={className} strokeWidth={1.5} /> : null;
  };

  const LiveIndicator = () => (
    <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-emerald-400">Analyzing emotions in real-time</span>
    </div>
  );

  const DataParticle = ({ delay, particleClass, agentIndex }: { delay: number; particleClass: string; agentIndex: number }) => {
    if (shouldReduceMotion) return null;

    // Calculate horizontal position based on agent index
    // Agents are at positions: 0 (left), 1 (center-left), 2 (center-right), 3 (right)
    // Card is centered, so particles should move towards center
    const startX = agentIndex === 0 ? 0 : agentIndex === 1 ? 0 : agentIndex === 2 ? 0 : 0;
    const endX = agentIndex === 0 ? 400 : agentIndex === 1 ? 150 : agentIndex === 2 ? -150 : -400;

    return (
      <motion.div
        className={particleClass}
        style={{ 
          left: '50%', 
          bottom: '-8px',
          transformOrigin: 'center',
        }}
        animate={{
          x: [startX, endX],
          y: [0, 250, 250],
          scale: [1, 0.8, 0],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: delay,
          ease: [0.43, 0.13, 0.23, 0.96],
          times: [0, 0.3, 0.9, 1],
        }}
      />
    );
  };

  const ProgressRing = () => {
    const activeAgents = 3;
    const progress = (activeAgents / 4) * 100;

    return (
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="50%" stopColor="#764ba2" />
                <stop offset="100%" stopColor="#f093fb" />
              </linearGradient>
            </defs>
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="rgba(139, 92, 246, 0.2)"
              strokeWidth="4"
              fill="none"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * progress / 100) }}
              transition={{ duration: 2, ease: "easeInOut" }}
              style={{
                strokeDasharray: 251.2,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-semibold">{progress.toFixed(0)}%</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{activeAgents} of 4 agents active</span>
      </div>
    );
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: i * 0.1,
      },
    }),
  };

  return (
    <section ref={sectionRef} className="py-20 bg-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none dark:opacity-100 opacity-50" />
      
      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            4 Intelligent Agents Building Your Profile
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Each agent specializes in understanding a unique aspect of your personality, working together to create a comprehensive picture of who you are.
          </p>
        </motion.div>

        {/* Desktop View */}
        <div className="hidden lg:block relative">
          <div className="grid grid-cols-4 gap-6 mb-16 relative">
            {agents.map((agent, index) => {
              const Icon = (lucide as any)[agent.icon];
              const SourceIcon = agent.sourceIcon === 'spotify' || agent.sourceIcon === 'youtube' 
                ? null 
                : (lucide as any)[agent.sourceIcon];

              return (
                <motion.div
                  key={agent.id}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={!shouldReduceMotion ? cardVariants : undefined}
                  whileHover={
                    !agent.comingSoon && !shouldReduceMotion
                      ? { scale: 1.05, transition: { duration: 0.2 } }
                      : undefined
                  }
                  onHoverStart={() => !agent.comingSoon && handleHoverStart(agent.id)}
                  onHoverEnd={handleHoverEnd}
                  role="article"
                  aria-label={`${agent.name} - AI agent for ${agent.source}`}
                  tabIndex={agent.comingSoon ? -1 : 0}
                  className={`relative rounded-xl p-6 bg-card border border-border z-10 group transition-all duration-300 ${
                    agent.comingSoon ? 'opacity-60' : ''
                  }`}
                  style={{
                    boxShadow: hoveredAgent === agent.id ? '0 0 20px rgba(102, 126, 234, 0.5)' : 'none',
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  {agent.comingSoon && (
                    <motion.div
                      className="absolute -top-3 -right-3 bg-lime-500 text-white text-xs font-medium px-3 py-1 rounded-full"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      COMING SOON
                    </motion.div>
                  )}

                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
                      padding: '1px',
                      zIndex: -1,
                    }}
                  >
                    <div className="w-full h-full bg-card rounded-xl" />
                  </motion.div>

                  <div className="flex justify-center mb-4">
                    <motion.div
                      className={agent.iconWrapperClass}
                      whileHover={!agent.comingSoon ? { rotate: [0, -10, 10, 0] } : undefined}
                      transition={{ duration: 0.5 }}
                    >
                      {Icon && <Icon className={agent.iconClass} strokeWidth={1.5} />}
                    </motion.div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{agent.name}</h3>
                      {agent.id === 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOceanModalOpen(true);
                          }}
                          className="group/info relative"
                          aria-label="Learn about OCEAN Psychology"
                        >
                          <motion.div
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 flex items-center justify-center border-2 border-emerald-500/50 hover:from-emerald-500/50 hover:to-emerald-600/50 hover:border-emerald-500/70 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            animate={{
                              boxShadow: [
                                '0 0 0 0 rgba(16, 185, 129, 0)',
                                '0 0 0 4px rgba(16, 185, 129, 0.1)',
                                '0 0 0 0 rgba(16, 185, 129, 0)',
                              ],
                            }}
                            transition={{
                              boxShadow: {
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              },
                            }}
                          >
                            {renderIcon('Info', 'w-4 h-4 text-emerald-600 dark:text-emerald-400 font-bold')}
                          </motion.div>
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-card border border-border text-xs rounded whitespace-nowrap opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                            OCEAN Model
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      {agent.sourceIcon === 'spotify' ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                      ) : agent.sourceIcon === 'youtube' ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      ) : (
                        SourceIcon && <SourceIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      )}
                      <span>{agent.source}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {agent.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + i * 0.1 }}
                      >
                        {renderIcon('Check', agent.checkIconClass)}
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {agent.showLiveIndicator && <LiveIndicator />}

                  {!agent.comingSoon && isInView && (
                    <>
                      <DataParticle delay={0} particleClass={agent.particleClass} agentIndex={index} />
                      <DataParticle delay={1.5} particleClass={agent.particleClass} agentIndex={index} />
                      <DataParticle delay={3} particleClass={agent.particleClass} agentIndex={index} />
                    </>
                  )}

                  {agent.comingSoon && (
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-card border border-border text-foreground text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-lg">
                      In Development - Join Waitlist
                    </div>
                  )}

                  <motion.div
                    className={`absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full ${agent.flowLineClass}`}
                    animate={{
                      height: hoveredAgent === agent.id ? '32px' : '24px',
                      width: hoveredAgent === agent.id ? '3px' : '2px',
                      opacity: hoveredAgent === agent.id ? 1 : 0.3,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-center mt-16">
            <motion.div
              className="relative max-w-lg w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Particle Receivers at the top of the card */}
              {isInView && (
                <>
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute -top-2 left-1/2 w-3 h-3 rounded-full bg-emerald-400/50 blur-sm"
                      style={{
                        left: `${25 + i * 16.66}%`,
                      }}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                    />
                  ))}
                </>
              )}
              
              <div className="rounded-2xl overflow-hidden relative">
                {/* Background Gradient Animation */}
                <BackgroundGradientAnimation
                  gradientBackgroundStart="rgb(6, 78, 59)"
                  gradientBackgroundEnd="rgb(4, 120, 87)"
                  firstColor="16, 185, 129"
                  secondColor="5, 150, 105"
                  thirdColor="52, 211, 153"
                  fourthColor="6, 95, 70"
                  fifthColor="110, 231, 183"
                  pointerColor="52, 211, 153"
                  size="80%"
                  blendingValue="hard-light"
                  containerClassName="absolute inset-0"
                  interactive={false}
                />
                
                {/* Card Content */}
                <div className="relative z-10 p-8 bg-card/80 backdrop-blur-sm">
                  <ProgressRing />

                  <div className="flex justify-center mb-6">
                    <motion.div
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderIcon('User', 'w-10 h-10 text-white')}
                    </motion.div>
                  </div>

                  <h3 className="text-2xl font-semibold text-center mb-3 tracking-tight">
                    Your Personality Profile
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    A comprehensive understanding built from multiple data sources, creating a unique portrait of who you are.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Core Traits', badgeClass: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg p-3 border border-emerald-500/20', dotClass: 'w-2 h-2 rounded-full bg-emerald-400' },
                      { label: 'Emotions', badgeClass: 'bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-3 border border-green-500/20', dotClass: 'w-2 h-2 rounded-full bg-green-400' },
                      { label: 'Interests', badgeClass: 'bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-lg p-3 border border-teal-500/20', dotClass: 'w-2 h-2 rounded-full bg-teal-400' },
                      { label: 'Behaviors', badgeClass: 'bg-gradient-to-br from-lime-500/20 to-lime-600/20 rounded-lg p-3 border border-lime-500/20', dotClass: 'w-2 h-2 rounded-full bg-lime-400' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className={item.badgeClass}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            className={item.dotClass}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                          />
                          <span className="text-xs font-medium">{item.label}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-6">
          {agents.map((agent, index) => {
            const Icon = (lucide as any)[agent.icon];
            const SourceIcon = agent.sourceIcon === 'spotify' || agent.sourceIcon === 'youtube'
              ? null
              : (lucide as any)[agent.sourceIcon];

            return (
              <div key={agent.id}>
                <motion.div
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={!shouldReduceMotion ? cardVariants : undefined}
                  className={`rounded-xl p-4 bg-card border border-border relative ${
                    agent.comingSoon ? 'opacity-60' : ''
                  }`}
                >
                  {agent.comingSoon && (
                    <motion.div
                      className="absolute -top-2 -right-2 bg-lime-500 text-white text-xs font-medium px-2 py-1 rounded-full"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      COMING SOON
                    </motion.div>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    <div className={agent.mobileIconWrapperClass}>
                      {Icon && <Icon className={agent.mobileIconClass} strokeWidth={1.5} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {agent.sourceIcon === 'spotify' ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                        ) : agent.sourceIcon === 'youtube' ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        ) : (
                          SourceIcon && <SourceIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        )}
                        <span>{agent.source}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {agent.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {renderIcon('Check', agent.checkIconClass)}
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {agent.showLiveIndicator && <LiveIndicator />}
                </motion.div>

                {index < agents.length - 1 && (
                  <div className="flex justify-center">
                    <motion.div
                      className="w-px h-8 bg-gradient-to-b from-emerald-400 via-green-400 to-teal-400"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-2xl overflow-hidden relative">
            {/* Background Gradient Animation */}
            <BackgroundGradientAnimation
              gradientBackgroundStart="rgb(6, 78, 59)"
              gradientBackgroundEnd="rgb(4, 120, 87)"
              firstColor="16, 185, 129"
              secondColor="5, 150, 105"
              thirdColor="52, 211, 153"
              fourthColor="6, 95, 70"
              fifthColor="110, 231, 183"
              pointerColor="52, 211, 153"
              size="80%"
              blendingValue="hard-light"
              containerClassName="absolute inset-0"
              interactive={false}
            />
            
            {/* Card Content */}
            <motion.div
              className="relative z-10 p-6 bg-card/80 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <ProgressRing />

              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-lg">
                  {renderIcon('User', 'w-8 h-8 text-white')}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-center mb-3 tracking-tight">
                Your Personality Profile
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                A comprehensive understanding built from multiple data sources, creating a unique portrait of who you are.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Core Traits', badgeClass: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg p-3 border border-emerald-500/20', dotClass: 'w-2 h-2 rounded-full bg-emerald-400' },
                  { label: 'Emotions', badgeClass: 'bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-3 border border-green-500/20', dotClass: 'w-2 h-2 rounded-full bg-green-400' },
                  { label: 'Interests', badgeClass: 'bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-lg p-3 border border-teal-500/20', dotClass: 'w-2 h-2 rounded-full bg-teal-400' },
                  { label: 'Behaviors', badgeClass: 'bg-gradient-to-br from-lime-500/20 to-lime-600/20 rounded-lg p-3 border border-lime-500/20', dotClass: 'w-2 h-2 rounded-full bg-lime-400' },
                ].map((item, i) => (
                  <div key={i} className={item.badgeClass}>
                    <div className="flex items-center gap-2">
                      <div className={item.dotClass} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* OCEAN Model Modal */}
      <OceanModelModal 
        isOpen={isOceanModalOpen} 
        onClose={() => setIsOceanModalOpen(false)} 
      />
    </section>
  );
}

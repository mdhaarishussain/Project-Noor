'use client';

import { motion } from 'framer-motion';
import { Check, X, MessageSquare } from 'lucide-react';
import { useRef } from 'react';
import { useInView } from 'framer-motion';
import Image from 'next/image';

interface ComparisonFeature {
  capability: string;
  description: string;
  bondhu: {
    status: 'check';
    label: string;
  };
  traditional: {
    status: 'x';
    label: string;
  };
}

export default function TechnicalDifferentiationPanel() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const features: ComparisonFeature[] = [
    {
      capability: 'Personality Understanding',
      description: 'OCEAN Big 5 based discovery',
      bondhu: { status: 'check', label: 'Advanced' },
      traditional: { status: 'x', label: 'Limited' },
    },
    {
      capability: 'Learning Approach',
      description: 'Multi-agent continuous adaptation',
      bondhu: { status: 'check', label: 'Dynamic' },
      traditional: { status: 'x', label: 'Static' },
    },
    {
      capability: 'Data Input',
      description: 'Multi-modal data sources',
      bondhu: { status: 'check', label: 'Multi-modal' },
      traditional: { status: 'x', label: 'Text-only' },
    },
    {
      capability: 'Pattern Recognition',
      description: 'Behavioral insights & predictions',
      bondhu: { status: 'check', label: 'Intelligent' },
      traditional: { status: 'x', label: 'Basic' },
    },
    {
      capability: 'Updates & Improvements',
      description: 'System maintenance approach',
      bondhu: { status: 'check', label: 'Automatic' },
      traditional: { status: 'x', label: 'Manual' },
    },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Agentic AI vs Traditional Chatbots
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how Bondhu's advanced AI capabilities stack up against conventional chatbot solutions
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          className="relative bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-border"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
          
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-6 px-6 sm:px-8 lg:px-10 text-sm font-medium text-muted-foreground uppercase tracking-wide w-1/3">
                    Capability
                  </th>
                  <th className="text-center py-6 px-6 sm:px-8 lg:px-10 w-1/3">
                    <motion.div
                      className="flex flex-col items-center gap-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="relative w-16 h-16">
                        {/* Light Mode Logo */}
                        <Image
                          src="/Light mode logo.svg"
                          alt="Bondhu Logo"
                          width={64}
                          height={64}
                          className="w-full h-full object-contain dark:hidden"
                        />
                        {/* Dark Mode Logo */}
                        <Image
                          src="/Dark mode Logo.svg"
                          alt="Bondhu Logo"
                          width={64}
                          height={64}
                          className="w-full h-full object-contain hidden dark:block"
                        />
                      </div>
                      <span className="text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                        Bondhu AI
                      </span>
                    </motion.div>
                  </th>
                  <th className="text-center py-6 px-6 sm:px-8 lg:px-10 w-1/3">
                    <motion.div
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary border border-border">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <span className="text-base font-semibold text-muted-foreground">
                        Traditional Chatbots
                      </span>
                    </motion.div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <motion.tr
                    key={feature.capability}
                    className="border-b border-border hover:bg-secondary/50 transition-colors last:border-b-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <td className="py-6 px-6 sm:px-8 lg:px-10">
                      <div className="text-sm sm:text-base font-medium">
                        {feature.capability}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </div>
                    </td>
                    <td className="py-6 px-6 sm:px-8 lg:px-10 text-center">
                      <div className="flex justify-center">
                        <motion.div
                          className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 sm:px-4 py-2 transition-colors group cursor-default"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                          </div>
                          <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400 hidden sm:inline group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                            {feature.bondhu.label}
                          </span>
                        </motion.div>
                      </div>
                    </td>
                    <td className="py-6 px-6 sm:px-8 lg:px-10 text-center">
                      <div className="flex justify-center">
                        <motion.div
                          className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg px-3 sm:px-4 py-2 transition-colors group cursor-default"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                            <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                          </div>
                          <span className="text-sm font-medium text-red-500 dark:text-red-400 hidden sm:inline group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">
                            {feature.traditional.label}
                          </span>
                        </motion.div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer Text */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
        >
          <p className="text-sm text-muted-foreground">
            Experience the difference that true agentic AI makes in understanding and adapting to your users
          </p>
        </motion.div>
      </div>
    </section>
  );
}

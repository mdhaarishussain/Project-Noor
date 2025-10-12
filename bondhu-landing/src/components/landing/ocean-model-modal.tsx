'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

interface OceanModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OceanModelModal({ isOpen, onClose }: OceanModelModalProps) {
  const oceanTraits = [
    {
      letter: 'O',
      name: 'Openness',
      description: 'Appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      letter: 'C',
      name: 'Conscientiousness',
      description: 'Tendency to be organized, dependable, and show self-discipline. Aim for achievement and prefer planned behavior.',
      color: 'from-green-500 to-green-600',
    },
    {
      letter: 'E',
      name: 'Extraversion',
      description: 'Energy, positive emotions, assertiveness, sociability, and tendency to seek stimulation in the company of others.',
      color: 'from-teal-500 to-teal-600',
    },
    {
      letter: 'A',
      name: 'Agreeableness',
      description: 'Tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      letter: 'N',
      name: 'Neuroticism',
      description: 'Tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.',
      color: 'from-lime-500 to-lime-600',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                      Powered by OCEAN Psychology
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold">The Big Five Personality Model</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scientifically validated framework used by psychologists worldwide
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Introduction */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground">
                    The OCEAN model (also known as the Big Five or Five Factor Model) is the most widely accepted and scientifically validated personality framework in psychology. 
                    It measures five broad dimensions of personality that remain relatively stable throughout adulthood.
                  </p>
                </div>

                {/* OCEAN Traits */}
                <div className="space-y-4">
                  {oceanTraits.map((trait, index) => (
                    <motion.div
                      key={trait.letter}
                      className="p-4 bg-muted/50 rounded-xl border border-border hover:border-emerald-500/30 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${trait.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <span className="text-white font-bold text-xl">{trait.letter}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{trait.name}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {trait.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* How We Use It */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    How Bondhu Uses OCEAN
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our Personality Agent uses the OCEAN framework as the foundation for understanding your unique traits. 
                    Through interactive scenarios and conversations, we assess these five dimensions to create a comprehensive 
                    personality profile that helps Bondhu communicate with you in a way that feels natural and personalized.
                  </p>
                </div>

                {/* Research References */}
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="font-semibold text-sm">Scientific References</h3>
                  <div className="space-y-2">
                    <a
                      href="https://doi.org/10.1037/a0015309"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-emerald-500 transition-colors">
                          The Big Five Personality Traits
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          John, O. P., Naumann, L. P., & Soto, C. J. (2008)
                        </p>
                      </div>
                    </a>
                    <a
                      href="https://doi.org/10.1146/annurev.psych.50.1.315"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-emerald-500 transition-colors">
                          The Five-Factor Model of Personality
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          McCrae, R. R., & John, O. P. (1992). Annual Review of Psychology
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

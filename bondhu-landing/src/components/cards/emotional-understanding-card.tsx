"use client";

import React from 'react';

// Static heart shape on 7x7 grid (49 dots)
const heartShape = [1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 37, 38, 39, 45];

export const EmotionalUnderstandingCard = () => {
  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
          }
          
          @keyframes colorShift {
            0% { background-color: #8B5CF6; box-shadow: 0 0 8px #8B5CF6; }
            16% { background-color: #EC4899; box-shadow: 0 0 8px #EC4899; }
            33% { background-color: #F59E0B; box-shadow: 0 0 8px #F59E0B; }
            50% { background-color: #10B981; box-shadow: 0 0 8px #10B981; }
            66% { background-color: #3B82F6; box-shadow: 0 0 8px #3B82F6; }
            83% { background-color: #EF4444; box-shadow: 0 0 8px #EF4444; }
            100% { background-color: #8B5CF6; box-shadow: 0 0 8px #8B5CF6; }
          }
          
          .heart-dot {
            transition: all 0.3s ease-out;
            animation: 
              pulse 2s infinite,
              colorShift 8s infinite;
          }
          
          .heart-dot:nth-child(3n) {
            animation: 
              pulse 2s infinite,
              colorShift 8s infinite;
            animation-delay: 0.2s, 0s;
          }
          
          .heart-dot:nth-child(5n) {
            animation: 
              pulse 2s infinite,
              colorShift 8s infinite;
            animation-delay: 0.4s, 0s;
          }
        `}
      </style>
      <div className="flex flex-col justify-between relative aspect-[4/3] min-h-[200px] w-full max-w-full p-6 rounded-[20px] border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] card--border-glow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="absolute top-3 right-3 z-10 scale-75 origin-top-right">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {Array.from({ length: 49 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  heartShape.includes(i) 
                    ? 'heart-dot' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="card__header flex justify-between gap-3 relative z-10">
          <span className="card__label text-sm opacity-70 text-gray-600 dark:text-gray-400">Empathetic</span>
        </div>
        <div className="card__content flex flex-col relative z-10">
          <h3 className="card__title font-semibold text-xl mb-2 text-gray-900 dark:text-white">
            Emotional Understanding
          </h3>
          <p className="card__description text-sm leading-relaxed opacity-80 text-gray-700 dark:text-gray-300 mb-4">
            Recognizes mood patterns and provides contextual emotional support when you need it most. Uses advanced sentiment analysis to detect subtle emotional cues in your conversations and offers personalized coping strategies, breathing exercises, and grounding techniques.
          </p>
        </div>
      </div>
    </>
  );
};

"use client";

import { DotLoader } from "@/components/dot-loader";

const game = [
    [14, 7, 0, 8, 6, 13, 20],
    [14, 7, 13, 20, 16, 27, 21],
    [14, 20, 27, 21, 34, 24, 28],
    [27, 21, 34, 28, 41, 32, 35],
    [34, 28, 41, 35, 48, 40, 42],
    [34, 28, 41, 35, 48, 42, 46],
    [34, 28, 41, 35, 48, 42, 38],
    [34, 28, 41, 35, 48, 30, 21],
    [34, 28, 41, 48, 21, 22, 14],
    [34, 28, 41, 21, 14, 16, 27],
    [34, 28, 21, 14, 10, 20, 27],
    [28, 21, 14, 4, 13, 20, 27],
    [28, 21, 14, 12, 6, 13, 20],
    [28, 21, 14, 6, 13, 20, 11],
    [28, 21, 14, 6, 13, 20, 10],
    [14, 6, 13, 20, 9, 7, 21],
];

export const GamifiedDiscoveryCard = () => {
  return (
    <>
      <style>
        {`
          .dot-loader .active {
            background-color: #8B5CF6 !important;
            transform: scale(1.2);
            transition: all 0.1s ease-out;
          }
          
          .dark .dot-loader .active {
            background-color: #8B5CF6 !important;
          }
        `}
      </style>
      <div className="flex flex-col justify-between relative aspect-[4/3] min-h-[200px] w-full max-w-full p-6 rounded-[20px] border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] card--border-glow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="absolute top-3 right-3 z-10">
          <DotLoader 
            frames={game}
            duration={150}
            dotClassName="bg-gray-300 dark:bg-gray-600 rounded-full"
            className="scale-75 dot-loader"
          />
        </div>
        <div className="card__header flex justify-between gap-3 relative z-10">
          <span className="card__label text-sm opacity-70 text-gray-600 dark:text-gray-400">Engaging</span>
        </div>
        <div className="card__content flex flex-col relative z-10">
          <h3 className="card__title font-semibold text-xl mb-2 text-gray-900 dark:text-white">
            Gamified Discovery
          </h3>
          <p className="card__description text-sm leading-relaxed opacity-80 text-gray-700 dark:text-gray-300 mb-4">
            Fun RPG scenarios and interactive games help you discover your personality traits naturally. Complete quests, earn badges, and unlock new insights about yourself through engaging challenges that feel less like assessments and more like adventures.
          </p>
        </div>
      </div>
    </>
  );
};

"use client";

import { MessageCircle, Play, User, Settings, Sparkles, Brain, Shield, Activity } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
  onSectionChange: (section: string) => void;
  activeSection?: string;
}

export function DashboardGrid({ onSectionChange, activeSection }: DashboardGridProps) {
  const handleSectionClick = (section: string) => {
    onSectionChange(section);

    // Smooth scroll to the section after a brief delay to allow tab change
    setTimeout(() => {
      const element = document.getElementById(`${section}-section`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      <GridItem
        area=""
        icon={<MessageCircle className="h-5 w-5" />}
        title="AI Chat Companion"
        description="Start a conversation with Bondhu, your personalized AI friend who understands your personality and adapts to your needs."
        onClick={() => handleSectionClick('chat')}
        isActive={activeSection === 'chat'}
        gradient="from-blue-400/80 to-cyan-400/80"
        darkGradient="from-blue-500/60 to-cyan-500/60"
        showPreview={false}
      />
      <GridItem
        area=""
        icon={<Play className="h-5 w-5" />}
        title="Entertainment Hub"
        description="Explore games, videos, and music while Bondhu learns about your personality and preferences."
        onClick={() => handleSectionClick('entertainment')}
        isActive={activeSection === 'entertainment'}
        gradient="from-violet-400/80 to-purple-400/80"
        darkGradient="from-violet-500/60 to-purple-500/60"
        showPreview={false}
      />
      <GridItem
        area=""
        icon={<Brain className="h-5 w-5" />}
        title="Personality Insights"
        description="Discover deep insights about yourself through AI-powered personality analysis and growth tracking."
        onClick={() => handleSectionClick('profile')}
        isActive={activeSection === 'profile'}
        gradient="from-emerald-400/80 to-teal-400/80"
        darkGradient="from-emerald-500/60 to-teal-500/60"
        showPreview={true}
        previewType="personality"
      />
      <GridItem
        area=""
        icon={<Settings className="h-5 w-5" />}
        title="Privacy & Settings"
        description="Manage your data, privacy preferences, and customize your Bondhu experience."
        onClick={() => handleSectionClick('settings')}
        isActive={activeSection === 'settings'}
        gradient="from-slate-400/80 to-gray-400/80"
        darkGradient="from-slate-500/60 to-gray-500/60"
        showPreview={true}
        previewType="settings"
      />
    </div>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
  gradient: string;
  darkGradient: string;
  showPreview?: boolean;
  previewType?: 'personality' | 'settings';
}

const GridItem = ({ icon, title, description, onClick, isActive, gradient, darkGradient, showPreview, previewType }: GridItemProps) => {
  return (
    <div className="min-h-[12rem] list-none cursor-pointer" onClick={onClick}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 transition-all duration-300 hover:scale-[1.02]">
        <GlowingEffect
          spread={30}
          glow={true}
          disabled={false}
          proximity={80}
          inactiveZone={0.1}
          borderWidth={2}
        />
        <div className={cn(
          "relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-xl border-[0.75px] p-5 shadow-sm transition-all duration-300",
          isActive
            ? `bg-gradient-to-br ${gradient} dark:bg-gradient-to-br dark:${darkGradient} text-white backdrop-blur-sm shadow-lg`
            : "bg-card hover:bg-muted/30 dark:hover:bg-muted/20 backdrop-blur-sm"
        )}>
          <div className="relative flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div className={cn(
                "w-fit rounded-lg border-[0.75px] p-2.5 transition-all duration-300",
                isActive
                  ? "border-white/30 bg-white/15 backdrop-blur-sm shadow-lg"
                  : "border-border bg-muted/70 dark:bg-muted/40 dark:border-border/50"
              )}>
                {icon}
              </div>
              {isActive && (
                <div className="flex items-center space-x-1 text-white/80">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-medium">Active</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className={cn(
                "text-lg leading-[1.25rem] font-semibold tracking-[-0.04em] text-balance",
                isActive ? "text-white" : "text-foreground"
              )}>
                {title}
              </h3>
              <p className={cn(
                "text-sm leading-[1.3rem] line-clamp-2",
                isActive ? "text-white/80" : "text-muted-foreground"
              )}>
                {description}
              </p>
              
              {/* Preview Components */}
              {showPreview && previewType === 'personality' && (
                <div className={cn(
                  "mt-3 pt-3 border-t transition-colors duration-300",
                  isActive 
                    ? "border-white/30" 
                    : "border-border/60 dark:border-border/40"
                )}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      "font-medium",
                      isActive ? "text-white/80" : "text-foreground/70 dark:text-foreground/60"
                    )}>
                      Latest Insights
                    </span>
                    <Activity className={cn(
                      "h-3 w-3",
                      isActive ? "text-white/70" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <div className={cn(
                      "rounded-full h-1 w-full",
                      isActive ? "bg-emerald-400/40" : "bg-emerald-500/30 dark:bg-emerald-400/25"
                    )} />
                    <div className={cn(
                      "rounded-full h-1 w-full",
                      isActive ? "bg-blue-400/40" : "bg-blue-500/30 dark:bg-blue-400/25"
                    )} />
                    <div className={cn(
                      "rounded-full h-1 w-full",
                      isActive ? "bg-purple-400/40" : "bg-purple-500/30 dark:bg-purple-400/25"
                    )} />
                  </div>
                  <div className="mt-1 text-xs">
                    <span className={cn(
                      "font-medium",
                      isActive ? "text-white/90" : "text-foreground/80 dark:text-foreground/70"
                    )}>
                      Openness: 75% • Creativity: 82%
                    </span>
                  </div>
                </div>
              )}
              
              {showPreview && previewType === 'settings' && (
                <div className={cn(
                  "mt-3 pt-3 border-t transition-colors duration-300",
                  isActive 
                    ? "border-white/30" 
                    : "border-border/60 dark:border-border/40"
                )}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      "font-medium",
                      isActive ? "text-white/80" : "text-foreground/70 dark:text-foreground/60"
                    )}>
                      Privacy Status
                    </span>
                    <Shield className={cn(
                      "h-3 w-3",
                      isActive ? "text-white/70" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="flex-1 bg-green-500/20 rounded-full h-1" />
                    <span className={cn(
                      "text-xs font-medium",
                      isActive ? "text-green-300" : "text-green-600 dark:text-green-400"
                    )}>Secure</span>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className={cn(
                      "font-medium",
                      isActive ? "text-white/90" : "text-foreground/80 dark:text-foreground/70"
                    )}>
                      All features enabled • Data encrypted
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



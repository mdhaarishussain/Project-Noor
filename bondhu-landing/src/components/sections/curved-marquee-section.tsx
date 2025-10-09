"use client"

import CurvedLoop from "@/components/ui/curved-loop"

export function CurvedMarqueeSection() {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
      {/* Gradient overlays for seamless blending */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      
      <CurvedLoop
        marqueeText="START YOUR JOURNEY • FIND YOUR BONDHU • MENTAL HEALTH MATTERS • YOU'RE NOT ALONE • "
        speed={2.5}
        className="fill-primary dark:fill-white"
        curveAmount={300}
        direction="left"
        interactive={true}
      />
    </section>
  )
}

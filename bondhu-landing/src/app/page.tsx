import { Navbar1 } from "@/components/ui/navbar-1"
import { HeroSection } from "@/components/sections/hero-section"
import { ProblemSection } from "@/components/sections/problem-section"
import { SolutionSection } from "@/components/sections/solution-section"
import MultiAgentArchitecture from "@/components/landing/multi-agent-architecture"
import { InteractiveDemo } from "@/components/sections/interactive-demo"
import { FeaturesSection } from "@/components/sections/features-section"
import { PricingSection } from "@/components/sections/pricing-section"
import { CurvedMarqueeSection } from "@/components/sections/curved-marquee-section"
import { Footer } from "@/components/sections/footer"
import { FloatingCTA } from "@/components/floating-cta"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar1 />
      <main className="pt-14">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <MultiAgentArchitecture />
        <InteractiveDemo />
        <FeaturesSection />
        <PricingSection />
        <CurvedMarqueeSection />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  )
}

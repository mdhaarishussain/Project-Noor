"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MagicBento from "@/components/ui/magic-bento"
import { GamifiedDiscoveryCard } from "@/components/cards/gamified-discovery-card"
import { EmotionalUnderstandingCard } from "@/components/cards/emotional-understanding-card"

export function FeaturesSection() {
  const bentoCards = [
    {
      title: "Adaptive Intelligence",
      description: "Learns your communication style and adapts conversations to match your personality over time",
      label: "Personalized",
    },
    {
      title: "Proactive Care",
      description: "Initiates check-ins and suggests activities based on your well-being patterns and preferences",
      label: "Wellness",
    },
    {
      customContent: <GamifiedDiscoveryCard />,
    },
    {
      customContent: <EmotionalUnderstandingCard />,
    },
    {
      title: "Privacy First",
      description: "End-to-end encryption ensures your conversations remain completely private and secure",
      label: "Secure",
    },
    {
      title: "Always Available",
      description: "24/7 companion that fits your schedule, perfect for late-night thoughts or early morning clarity",
      label: "Accessible",
    },
  ]

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Bondhu?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI technology meets genuine emotional understanding
          </p>
        </motion.div>

        <motion.div
          className="flex justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <MagicBento 
            textAutoHide={false}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={300}
            particleCount={12}
            glowColor="132, 0, 255"
            cards={bentoCards}
          />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-0 text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-2xl font-bold mb-3">
                Experience the Difference
              </h3>
              <p className="text-muted-foreground mb-6">
                Join users who've found their perfect AI companion
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">Personality-aware</Badge>
                <Badge variant="outline">Emotionally intelligent</Badge>
                <Badge variant="outline">Privacy-focused</Badge>
                <Badge variant="outline">Always learning</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

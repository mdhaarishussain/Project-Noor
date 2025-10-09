"use client"

import { Navbar1 } from "@/components/ui/navbar-1"

const NavbarDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Navbar1 />
      
      {/* Demo Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Enhanced Frosted Glass Navbar
          </h1>
          <p className="text-xl text-muted-foreground">
            A beautiful, accessible navbar with liquid glass effect, dark mode support, and smooth animations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 text-left">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">✨ Frosted Glass Effect</h3>
              <p className="text-sm text-muted-foreground">
                Beautiful backdrop blur with transparency for a modern, premium look.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">🌓 Dark Mode Ready</h3>
              <p className="text-sm text-muted-foreground">
                Seamless theme switching with perfect contrast in both light and dark modes.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">📱 Fully Responsive</h3>
              <p className="text-sm text-muted-foreground">
                Mobile-first design with smooth transitions and optimized touch interactions.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">🎯 Brand Integrated</h3>
              <p className="text-sm text-muted-foreground">
                Uses your existing Bondhu logo and matches your brand's visual identity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { NavbarDemo }

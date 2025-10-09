"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = "", width = 120, height = 40 }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div 
        className={`${className}`} 
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    )
  }

  const isDark = resolvedTheme === "dark"
  const logoSrc = isDark ? "/Dark mode Logo.svg" : "/Light mode logo.svg"

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={logoSrc}
        alt="Bondhu Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  )
}

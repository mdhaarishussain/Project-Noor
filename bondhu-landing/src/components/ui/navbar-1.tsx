"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useTheme()
  const { isAuthenticated, loading } = useAuth()

  const toggleMenu = () => setIsOpen(!isOpen)

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "Demo", href: "#demo" },
    { name: "Pricing", href: "#pricing" },
  ]

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full py-2 px-4">
      <div className="flex items-center justify-between px-6 py-1 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/30 dark:border-white/10 rounded-full shadow-2xl shadow-black/10 dark:shadow-black/30 w-full max-w-5xl relative z-10 h-12 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none">
        {/* Logo */}
        <div className="flex items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/" className="flex items-center">
              <Logo width={140} height={32} />
            </Link>
          </motion.div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 h-8">
          {navItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link 
                href={item.href} 
                className="text-sm text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-3 h-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <ThemeToggle />
          </motion.div>

          {!loading && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={isAuthenticated ? "/dashboard" : "/sign-up"}
                className="inline-flex items-center justify-center px-5 py-1 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/80 rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
              >
                {isAuthenticated ? "Dashboard" : "Get Started"}
              </Link>
            </motion.div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <motion.button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg"
            onClick={toggleMenu}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="h-4 w-4 text-gray-900 dark:text-gray-100" />
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Overlay with Liquid Glass */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-3xl backdrop-saturate-150 z-50 pt-24 px-6 md:hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent dark:before:from-white/5 dark:before:to-transparent before:pointer-events-none"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <motion.button
              className="absolute top-6 right-6 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
            </motion.button>

            {/* Mobile Menu Content */}
            <div className="flex flex-col space-y-8">
              {/* Logo in Mobile Menu */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center"
              >
                <Logo width={140} height={50} />
              </motion.div>

              {/* Navigation Links */}
              {navItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Link
                    href={item.href}
                    className="text-lg text-gray-900 dark:text-gray-100 font-medium hover:text-primary transition-colors block"
                    onClick={toggleMenu}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              {/* CTA Button */}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="pt-6"
                >
                  <Link
                    href={isAuthenticated ? "/dashboard" : "/sign-up"}
                    className="inline-flex items-center justify-center w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-primary to-primary/80 rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                    onClick={toggleMenu}
                  >
                    {isAuthenticated ? "Dashboard" : "Get Started"}
                  </Link>
                </motion.div>
              )}

              {/* Bengali Text Decoration */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-4xl font-bold text-primary/10 dark:text-primary/5 select-none"
              >
                বন্ধু
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { Navbar1 }

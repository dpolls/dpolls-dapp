"use client"

import { useState} from "react"
import { useSignature } from '@/hooks';
import { Link } from 'react-router-dom'

export default function LandingPageHeader() {
  const { isConnected } = useSignature();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm text-white">D</span>
          </div>
          <span className="text-xl font-bold">dpolls</span>
        </div>
        </Link>
        {isConnected &&
          <>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/polls/live" className="text-muted-foreground hover:text-foreground">
                Live Polls
              </Link>
              <Link to="/polls/new" className="text-muted-foreground hover:text-foreground">
                Create Poll
              </Link>
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                Admin
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </>
        }
      </div>

      {/* Mobile Navigation */}
      {isConnected && isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <Link
              to="/polls/live"
              className="block text-muted-foreground hover:text-foreground py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Live Polls
            </Link>
            <Link
              to="/polls/new"
              className="block text-muted-foreground hover:text-foreground py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create Poll
            </Link>
            <Link to="/admin"
              className="block text-muted-foreground hover:text-foreground py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}    
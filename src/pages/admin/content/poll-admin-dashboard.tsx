"use client"

import { useState } from "react"
import { Link } from 'react-router-dom'
import { Home, PlusCircle, Settings, Gamepad2, Trophy, MenuIcon, User, Bell, ChevronRight, Play, BadgeHelp } from "lucide-react"
import { Button } from "@/components/ui_v3/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui_v3/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui_v3/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui_v3/sheet"
import { cn } from "@/lib/utils"
import LeftSidebar from "@/pages/admin/content/left-sidebar"
import RightSidebar from "@/pages/admin/content/right-sidebar"
import DashboardContent from "@/pages/admin/content/dashboard-content"
import GuidedTour from "@/pages/admin/content/guided-tour"

export default function PollAdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [tourActive, setTourActive] = useState(() => {
    // Initialize from localStorage, default to true if not set
    const savedTourState = localStorage.getItem('poll-admin-tour-completed')
    console.log('savedTourState', savedTourState)
    console.log('typeof savedTourState', typeof savedTourState)

    const isSaved = savedTourState !== 'true';
    console.log('isSaved', isSaved)

    return isSaved;
  })

  const handleTourClose = () => {
    setTourActive(false)
    localStorage.setItem('poll-admin-tour-completed', 'true')
  }

  return (
    <div className="flex flex-col h-screen bg-background ml-0 mt-3 pl-0 pt-0 pr-5 mr-5">
      {/* Header */}
      <header className="border-b sticky top-0 z-40 bg-background">
        <div className="flex h-16 items-center px-4 justify-between">
          <div className="flex items-center" data-tour="dashboard-header">
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2 p-0">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
                <LeftSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={true} />
              </SheetContent>
            </Sheet>

            <Link to="/">
              <h1 className="text-xl font-bold">Poll Admin</h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTourActive(true)}>
              <BadgeHelp className="h-5 w-5" />
              <span className="sr-only">Start Tour</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/abstract-geometric-shapes.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile right sidebar toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Toggle right panel</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px] p-0" style={{zIndex: 9999999}}>
                <RightSidebar isMobile={true} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - hidden on mobile */}
        <div
          className={cn(
            "hidden md:block border-r w-64 shrink-0 transition-all duration-300",
            !leftSidebarOpen && "md:w-0 md:opacity-0",
          )}
        >
          <LeftSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={false} />
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <DashboardContent activeTab={activeTab} setActiveTab={setActiveTab} />
        </main>

        {/* Right sidebar - hidden on mobile */}
        <div
          className={cn(
            "hidden md:block border-l w-64 shrink-0 transition-all duration-300",
            !rightSidebarOpen && "md:w-0 md:opacity-0",
          )}
        >
          <RightSidebar isMobile={false} />
        </div>
      </div>

      {/* Fixed floating footer */}
      {/* <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-1 p-1 bg-background border rounded-full shadow-lg z-50 bg-white">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setActiveTab("dashboard")}>
          <Home className={cn("h-5 w-5", activeTab === "dashboard" ? "text-primary" : "text-muted-foreground")} />
          <span className="sr-only">Home</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setActiveTab("create-poll")}
          data-tour="create-poll-footer"
        >
          <PlusCircle
            className={cn("h-5 w-5", activeTab === "create-poll" ? "text-primary" : "text-muted-foreground")}
          />
          <span className="sr-only">Create Poll</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setActiveTab("settings")}>
          <Settings className={cn("h-5 w-5", activeTab === "settings" ? "text-primary" : "text-muted-foreground")} />
          <span className="sr-only">Settings</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setActiveTab("games")}>
          <Gamepad2 className={cn("h-5 w-5", activeTab === "games" ? "text-primary" : "text-muted-foreground")} />
          <span className="sr-only">Games</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setActiveTab("leaderboard")}
          data-tour="leaderboard-nav"
        >
          <Trophy className={cn("h-5 w-5", activeTab === "leaderboard" ? "text-primary" : "text-muted-foreground")} />
          <span className="sr-only">Leaderboard</span>
        </Button>
      </footer> */}
      <GuidedTour
        isActive={tourActive}
        onClose={handleTourClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  )
}

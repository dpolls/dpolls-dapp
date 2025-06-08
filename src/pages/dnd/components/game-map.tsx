"use client"

import type React from "react"
import { useGame } from "../game-context"
import { useRef } from "react"
import { Flame } from "lucide-react"

export default function GameMap() {
  const { setCharacterPosition, setTargetPosition } = useGame()
  const mapRef = useRef<HTMLDivElement>(null)

  // Handle map click to move character
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Set the target position for the character to move to
    setTargetPosition({ x, y })
  }

  // Create a grid of dungeon floor tiles
  const tileSize = 10 // 10% of the container
  const tiles = []

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const isAlternate = (x + y) % 2 === 0
      tiles.push(
        <div
          key={`tile-${x}-${y}`}
          className={`absolute ${isAlternate ? "bg-stone-700" : "bg-stone-800"}`}
          style={{
            left: `${x * tileSize}%`,
            top: `${y * tileSize}%`,
            width: `${tileSize}%`,
            height: `${tileSize}%`,
            backgroundImage: isAlternate
              ? "radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%)"
              : "none",
          }}
        />,
      )
    }
  }

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 cursor-pointer"
      onClick={handleMapClick}
      style={{
        background: "#1a1a1a",
        overflow: "hidden",
      }}
    >
      {/* Dungeon floor tiles */}
      {tiles}
      {/* Dungeon walls */}
      <div className="absolute left-0 top-0 w-full h-[5%] bg-stone-900 shadow-md" /> {/* Top wall */}
      <div className="absolute left-0 bottom-0 w-full h-[5%] bg-stone-900 shadow-md" /> {/* Bottom wall */}
      <div className="absolute left-0 top-0 w-[5%] h-full bg-stone-900 shadow-md" /> {/* Left wall */}
      <div className="absolute right-0 top-0 w-[5%] h-full bg-stone-900 shadow-md" /> {/* Right wall */}
      {/* Wall details */}
      <div className="absolute left-[5%] top-0 w-[90%] h-[2%] bg-stone-700" /> {/* Top trim */}
      <div className="absolute left-[5%] bottom-0 w-[90%] h-[2%] bg-stone-700" /> {/* Bottom trim */}
      <div className="absolute left-0 top-[5%] w-[2%] h-[90%] bg-stone-700" /> {/* Left trim */}
      <div className="absolute right-0 top-[5%] w-[2%] h-[90%] bg-stone-700" /> {/* Right trim */}
      {/* Torches */}
      <div className="absolute left-[10%] top-[2%] w-[3%] h-[6%] flex flex-col items-center">
        <div className="w-[60%] h-[40%] bg-amber-800 rounded-b-sm" /> {/* Torch base */}
        <Flame className="w-full h-[60%] text-orange-500 animate-pulse" />
      </div>
      <div className="absolute right-[10%] top-[2%] w-[3%] h-[6%] flex flex-col items-center">
        <div className="w-[60%] h-[40%] bg-amber-800 rounded-b-sm" /> {/* Torch base */}
        <Flame className="w-full h-[60%] text-orange-500 animate-pulse" />
      </div>
      <div className="absolute left-[10%] bottom-[2%] w-[3%] h-[6%] flex flex-col items-center">
        <div className="w-[60%] h-[40%] bg-amber-800 rounded-b-sm" /> {/* Torch base */}
        <Flame className="w-full h-[60%] text-orange-500 animate-pulse" />
      </div>
      <div className="absolute right-[10%] bottom-[2%] w-[3%] h-[6%] flex flex-col items-center">
        <div className="w-[60%] h-[40%] bg-amber-800 rounded-b-sm" /> {/* Torch base */}
        <Flame className="w-full h-[60%] text-orange-500 animate-pulse" />
      </div>
      {/* D&D Elements */}
      {/* Treasure chest */}
      <div className="absolute left-[75%] top-[25%] w-[8%] h-[6%]">
        <div className="w-full h-[60%] bg-amber-800 rounded-md border-t-2 border-yellow-600" /> {/* Chest body */}
        <div className="w-full h-[40%] bg-amber-900 rounded-b-md" /> {/* Chest bottom */}
        <div className="absolute left-[45%] top-[30%] w-[10%] h-[20%] bg-yellow-500 rounded-full" /> {/* Lock */}
      </div>
      {/* Barrel */}
      <div className="absolute left-[15%] top-[30%] w-[6%] h-[8%]">
        <div className="w-full h-full bg-amber-700 rounded-md border-t-2 border-b-2 border-amber-900" />
        <div className="absolute left-[10%] top-[20%] w-[80%] h-[10%] bg-amber-900" /> {/* Barrel ring */}
        <div className="absolute left-[10%] top-[70%] w-[80%] h-[10%] bg-amber-900" /> {/* Barrel ring */}
      </div>
      {/* Table with potion */}
      <div className="absolute left-[30%] top-[70%] w-[10%] h-[8%]">
        <div className="w-full h-[30%] bg-amber-800 rounded-md" /> {/* Table top */}
        <div className="absolute left-[10%] top-[30%] w-[10%] h-[70%] bg-amber-900" /> {/* Table leg */}
        <div className="absolute right-[10%] top-[30%] w-[10%] h-[70%] bg-amber-900" /> {/* Table leg */}
        <div className="absolute left-[40%] top-[0%] w-[20%] h-[40%] bg-purple-600 rounded-full" /> {/* Potion */}
        <div className="absolute left-[45%] top-[-20%] w-[10%] h-[20%] bg-purple-800" /> {/* Potion neck */}
      </div>
      {/* Weapon rack */}
      <div className="absolute right-[25%] top-[75%] w-[8%] h-[10%]">
        <div className="w-full h-[20%] bg-amber-900 rounded-md" /> {/* Rack top */}
        <div className="w-full h-[20%] bg-amber-900 rounded-md bottom-0 absolute" /> {/* Rack bottom */}
        <div className="absolute left-[20%] top-[20%] w-[5%] h-[60%] bg-gray-400" /> {/* Sword */}
        <div className="absolute left-[40%] top-[20%] w-[20%] h-[5%] bg-gray-600 rounded-full" /> {/* Axe handle */}
        <div className="absolute left-[40%] top-[25%] w-[20%] h-[40%] bg-gray-400 rounded-md" /> {/* Axe head */}
        <div className="absolute right-[20%] top-[20%] w-[5%] h-[60%] bg-amber-700" /> {/* Staff */}
      </div>
      {/* Magical circle in center */}
      <div
        className="absolute left-[50%] top-[50%] w-[20%] h-[20%] transform -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(138, 43, 226, 0.2), transparent 70%)",
          boxShadow: "0 0 20px rgba(138, 43, 226, 0.3)",
        }}
      >
        <div
          className="absolute inset-[10%] rounded-full border-2 border-purple-500 opacity-50"
          style={{
            animation: "rotate 20s linear infinite",
          }}
        />
        <div
          className="absolute inset-[30%] rounded-full border border-blue-400 opacity-30"
          style={{
            animation: "rotate 15s linear reverse infinite",
          }}
        />
      </div>
      {/* Cobwebs in corners */}
      <div
        className="absolute left-0 top-0 w-[8%] h-[8%] opacity-30 bg-white"
        style={{
          maskImage: "linear-gradient(45deg, transparent 0%, black 100%)",
          WebkitMaskImage: "linear-gradient(45deg, transparent 0%, black 100%)",
        }}
      />
      <div
        className="absolute right-0 top-0 w-[8%] h-[8%] opacity-30 bg-white"
        style={{
          maskImage: "linear-gradient(-45deg, transparent 0%, black 100%)",
          WebkitMaskImage: "linear-gradient(-45deg, transparent 0%, black 100%)",
        }}
      />
      {/* Dungeon border */}
      <div className="absolute inset-0 border-4 border-stone-900 rounded-lg pointer-events-none" />
    </div>
  )
}

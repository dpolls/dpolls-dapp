"use client"

import { useEffect, useState } from "react"
import { useGame } from "../game-context"

export default function Character() {
  const { characterPosition, selectedCharacter } = useGame()
  const [direction, setDirection] = useState<"left" | "right">("right")

  // Update direction based on horizontal movement
  useEffect(() => {
    const handleDirectionChange = (e: MouseEvent) => {
      // Get center of screen
      const centerX = window.innerWidth / 2

      // Set direction based on mouse position
      if (e.clientX < centerX) {
        setDirection("left")
      } else {
        setDirection("right")
      }
    }

    window.addEventListener("mousemove", handleDirectionChange)
    return () => window.removeEventListener("mousemove", handleDirectionChange)
  }, [])

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
      style={{
        left: `${characterPosition.x}%`,
        top: `${characterPosition.y}%`,
        transition: "left 0.3s, top 0.3s", // Smooth transition without animation
      }}
    >
      {/* Shadow under character */}
      <div className="absolute bg-black/30 w-8 h-3 rounded-full left-1/2 -translate-x-1/2 bottom-0 blur-[1px]" />

      {/* Character Selection */}
      {selectedCharacter === "link" && <LinkCharacter direction={direction} />}

      {selectedCharacter === "mario" && <MarioCharacter direction={direction} />}

      {selectedCharacter === "luigi" && <LuigiCharacter direction={direction} />}

      {selectedCharacter === "toad" && <ToadCharacter direction={direction} />}

      {selectedCharacter === "peach" && <PeachCharacter direction={direction} />}
    </div>
  )
}

// Link Character
function LinkCharacter({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      className={`relative ${direction === "left" ? "scale-x-[-1]" : ""}`}
      style={{
        width: "40px",
        height: "60px",
        transformOrigin: "center",
      }}
    >
      {/* Pointed Hat */}
      <div
        className="absolute w-0 h-0 left-[12px] top-[-8px]"
        style={{
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: "16px solid #4ade80",
        }}
      />

      {/* Head with blonde hair */}
      <div className="absolute rounded-full bg-amber-200 w-[20px] h-[20px] left-[10px] top-[5px]">
        {/* Blonde bangs */}
        <div className="absolute w-[22px] h-[8px] bg-yellow-300 -top-[2px] -left-[1px] rounded-t-full" />
        {/* Face */}
        <div className="absolute w-[4px] h-[1px] bg-black left-[4px] top-[10px]" /> {/* Left eye */}
        <div className="absolute w-[4px] h-[1px] bg-black left-[12px] top-[10px]" /> {/* Right eye */}
      </div>

      {/* Green Tunic */}
      <div className="absolute rounded-md bg-green-500 w-[24px] h-[25px] left-[8px] top-[23px]">
        {/* Belt */}
        <div className="absolute w-full h-[4px] bg-amber-800 bottom-0" />
      </div>

      {/* Shield (on back) */}
      {direction === "right" && (
        <div className="absolute bg-blue-700 w-[12px] h-[16px] rounded-t-md left-[4px] top-[25px] border border-yellow-500" />
      )}

      {/* Sword (on back) */}
      {direction === "left" && (
        <div className="absolute bg-gray-400 w-[4px] h-[20px] left-[30px] top-[22px]">
          <div className="absolute w-[8px] h-[4px] bg-yellow-500 top-[-4px] left-[-2px]" /> {/* Hilt */}
        </div>
      )}

      {/* Arms */}
      <div className="absolute bg-amber-200 w-[8px] h-[20px] rounded-full left-[2px] top-[25px]" />
      <div className="absolute bg-amber-200 w-[8px] h-[20px] rounded-full left-[30px] top-[25px]" />

      {/* Legs */}
      <div className="absolute bg-white w-[10px] h-[18px] rounded-full left-[8px] top-[45px]" />
      <div className="absolute bg-white w-[10px] h-[18px] rounded-full left-[22px] top-[45px]" />

      {/* Boots */}
      <div className="absolute bg-amber-800 w-[10px] h-[5px] rounded-b-md left-[8px] top-[58px]" />
      <div className="absolute bg-amber-800 w-[10px] h-[5px] rounded-b-md left-[22px] top-[58px]" />
    </div>
  )
}

// Mario Character
function MarioCharacter({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      className={`relative ${direction === "left" ? "scale-x-[-1]" : ""}`}
      style={{
        width: "40px",
        height: "60px",
        transformOrigin: "center",
      }}
    >
      {/* Cap */}
      <div className="absolute bg-red-600 w-[24px] h-[10px] left-[8px] top-[2px] rounded-t-full" />
      <div className="absolute bg-red-600 w-[10px] h-[5px] left-[11px] top-[-3px] rounded-t-full" /> {/* Cap top */}
      <div className="absolute bg-white w-[12px] h-[10px] left-[10px] top-[2px] rounded-full flex items-center justify-center">
        <div className="text-red-600 text-[8px] font-bold">M</div>
      </div>
      {/* Head */}
      <div className="absolute rounded-full bg-[#e0ac69] w-[20px] h-[18px] left-[10px] top-[8px]">
        {/* Mustache */}
        <div className="absolute bg-[#4a2511] w-[18px] h-[5px] bottom-[2px] left-[1px] rounded-b-lg" />
        {/* Eyes */}
        <div className="absolute w-[4px] h-[4px] bg-black left-[3px] top-[6px] rounded-full" />
        <div className="absolute w-[4px] h-[4px] bg-black right-[3px] top-[6px] rounded-full" />
        {/* Nose */}
        <div className="absolute w-[8px] h-[5px] bg-[#e0ac69] left-[6px] top-[8px] rounded-full" />
      </div>
      {/* Body */}
      <div className="absolute bg-red-600 w-[24px] h-[20px] left-[8px] top-[25px] rounded-md" />
      {/* Overalls */}
      <div className="absolute bg-blue-700 w-[24px] h-[12px] left-[8px] top-[33px] rounded-b-md" />
      <div className="absolute bg-blue-700 w-[10px] h-[10px] left-[8px] top-[25px] rounded-tl-md" />
      <div className="absolute bg-blue-700 w-[10px] h-[10px] left-[22px] top-[25px] rounded-tr-md" />
      {/* Arms */}
      <div className="absolute bg-[#e0ac69] w-[8px] h-[16px] rounded-full left-[0px] top-[25px]" />
      <div className="absolute bg-[#e0ac69] w-[8px] h-[16px] rounded-full right-[0px] top-[25px]" />
      {/* Legs */}
      <div className="absolute bg-blue-700 w-[10px] h-[15px] left-[8px] top-[45px]" />
      <div className="absolute bg-blue-700 w-[10px] h-[15px] left-[22px] top-[45px]" />
      {/* Boots */}
      <div className="absolute bg-[#6a3805] w-[12px] h-[5px] rounded-b-md left-[6px] top-[55px]" />
      <div className="absolute bg-[#6a3805] w-[12px] h-[5px] rounded-b-md left-[22px] top-[55px]" />
    </div>
  )
}

// Luigi Character
function LuigiCharacter({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      className={`relative ${direction === "left" ? "scale-x-[-1]" : ""}`}
      style={{
        width: "40px",
        height: "60px",
        transformOrigin: "center",
      }}
    >
      {/* Cap */}
      <div className="absolute bg-green-600 w-[24px] h-[10px] left-[8px] top-[0px] rounded-t-full" />
      <div className="absolute bg-green-600 w-[10px] h-[5px] left-[11px] top-[-5px] rounded-t-full" /> {/* Cap top */}
      <div className="absolute bg-white w-[12px] h-[10px] left-[10px] top-[0px] rounded-full flex items-center justify-center">
        <div className="text-green-600 text-[8px] font-bold">L</div>
      </div>
      {/* Head */}
      <div className="absolute rounded-full bg-[#e0ac69] w-[20px] h-[20px] left-[10px] top-[8px]">
        {/* Mustache */}
        <div className="absolute bg-[#4a2511] w-[20px] h-[6px] bottom-[2px] left-[0px] rounded-b-lg" />
        {/* Eyes */}
        <div className="absolute w-[4px] h-[4px] bg-black left-[3px] top-[7px] rounded-full" />
        <div className="absolute w-[4px] h-[4px] bg-black right-[3px] top-[7px] rounded-full" />
        {/* Nose */}
        <div className="absolute w-[8px] h-[5px] bg-[#e0ac69] left-[6px] top-[9px] rounded-full" />
      </div>
      {/* Body */}
      <div className="absolute bg-green-600 w-[24px] h-[20px] left-[8px] top-[27px] rounded-md" />
      {/* Overalls */}
      <div className="absolute bg-blue-700 w-[24px] h-[12px] left-[8px] top-[35px] rounded-b-md" />
      <div className="absolute bg-blue-700 w-[10px] h-[10px] left-[8px] top-[27px] rounded-tl-md" />
      <div className="absolute bg-blue-700 w-[10px] h-[10px] left-[22px] top-[27px] rounded-tr-md" />
      {/* Arms */}
      <div className="absolute bg-[#e0ac69] w-[8px] h-[18px] rounded-full left-[0px] top-[27px]" />
      <div className="absolute bg-[#e0ac69] w-[8px] h-[18px] rounded-full right-[0px] top-[27px]" />
      {/* Legs */}
      <div className="absolute bg-blue-700 w-[10px] h-[15px] left-[8px] top-[47px]" />
      <div className="absolute bg-blue-700 w-[10px] h-[15px] left-[22px] top-[47px]" />
      {/* Boots */}
      <div className="absolute bg-[#6a3805] w-[12px] h-[5px] rounded-b-md left-[6px] top-[57px]" />
      <div className="absolute bg-[#6a3805] w-[12px] h-[5px] rounded-b-md left-[22px] top-[57px]" />
    </div>
  )
}

// Toad Character
function ToadCharacter({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      className={`relative ${direction === "left" ? "scale-x-[-1]" : ""}`}
      style={{
        width: "40px",
        height: "55px",
        transformOrigin: "center",
      }}
    >
      {/* Mushroom cap */}
      <div className="absolute bg-white w-[30px] h-[20px] left-[5px] top-[-5px] rounded-t-full" />
      <div className="absolute bg-red-500 w-[30px] h-[10px] left-[5px] top-[-5px] rounded-t-full">
        {/* Spots */}
        <div className="absolute bg-white w-[6px] h-[6px] left-[4px] top-[2px] rounded-full" />
        <div className="absolute bg-white w-[6px] h-[6px] right-[4px] top-[2px] rounded-full" />
        <div className="absolute bg-white w-[6px] h-[6px] left-[12px] top-[5px] rounded-full" />
      </div>

      {/* Face */}
      <div className="absolute rounded-md bg-white w-[20px] h-[18px] left-[10px] top-[15px]">
        {/* Eyes */}
        <div className="absolute w-[4px] h-[4px] bg-black left-[3px] top-[6px] rounded-full" />
        <div className="absolute w-[4px] h-[4px] bg-black right-[3px] top-[6px] rounded-full" />
        {/* Mouth */}
        <div className="absolute w-[8px] h-[2px] bg-black left-[6px] top-[12px]" />
      </div>

      {/* Body */}
      <div className="absolute bg-blue-600 w-[24px] h-[18px] left-[8px] top-[30px] rounded-md" />

      {/* Vest */}
      <div className="absolute bg-red-500 w-[16px] h-[12px] left-[12px] top-[30px] rounded-md" />

      {/* Arms */}
      <div className="absolute bg-white w-[7px] h-[14px] rounded-full left-[1px] top-[30px]" />
      <div className="absolute bg-white w-[7px] h-[14px] rounded-full right-[1px] top-[30px]" />

      {/* Legs */}
      <div className="absolute bg-white w-[8px] h-[10px] left-[10px] top-[45px] rounded-b-md" />
      <div className="absolute bg-white w-[8px] h-[10px] right-[10px] top-[45px] rounded-b-md" />

      {/* Shoes */}
      <div className="absolute bg-[#6a3805] w-[10px] h-[4px] rounded-b-md left-[8px] top-[51px]" />
      <div className="absolute bg-[#6a3805] w-[10px] h-[4px] rounded-b-md right-[8px] top-[51px]" />
    </div>
  )
}

// Princess Peach Character
function PeachCharacter({ direction }: { direction: "left" | "right" }) {
  return (
    <div
      className={`relative ${direction === "left" ? "scale-x-[-1]" : ""}`}
      style={{
        width: "40px",
        height: "60px",
        transformOrigin: "center",
      }}
    >
      {/* Crown */}
      <div className="absolute bg-yellow-500 w-[16px] h-[8px] left-[12px] top-[-5px] rounded-t-md">
        <div className="absolute bg-red-500 w-[4px] h-[4px] left-[6px] top-[2px] rounded-full" />
      </div>

      {/* Hair */}
      <div className="absolute bg-yellow-300 w-[24px] h-[20px] left-[8px] top-[3px] rounded-t-full" />

      {/* Face */}
      <div className="absolute rounded-full bg-[#ffe0bd] w-[20px] h-[18px] left-[10px] top-[8px]">
        {/* Eyes */}
        <div className="absolute w-[4px] h-[4px] bg-blue-500 left-[3px] top-[7px] rounded-full" />
        <div className="absolute w-[4px] h-[4px] bg-blue-500 right-[3px] top-[7px] rounded-full" />
        {/* Mouth */}
        <div className="absolute w-[6px] h-[2px] bg-red-400 left-[7px] top-[12px] rounded-full" />
      </div>

      {/* Dress top */}
      <div className="absolute bg-pink-400 w-[24px] h-[15px] left-[8px] top-[25px] rounded-t-full" />

      {/* Dress bottom */}
      <div className="absolute bg-pink-400 w-[30px] h-[20px] left-[5px] top-[38px] rounded-full" />

      {/* Arms */}
      <div className="absolute bg-[#ffe0bd] w-[6px] h-[18px] rounded-full left-[2px] top-[25px]" />
      <div className="absolute bg-[#ffe0bd] w-[6px] h-[18px] rounded-full right-[2px] top-[25px]" />

      {/* Legs */}
      <div className="absolute bg-[#ffe0bd] w-[6px] h-[10px] left-[12px] top-[52px]" />
      <div className="absolute bg-[#ffe0bd] w-[6px] h-[10px] right-[12px] top-[52px]" />

      {/* Shoes */}
      <div className="absolute bg-red-500 w-[8px] h-[4px] rounded-md left-[10px] top-[58px]" />
      <div className="absolute bg-red-500 w-[8px] h-[4px] rounded-md right-[10px] top-[58px]" />
    </div>
  )
}

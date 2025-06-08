"use client"

import { useGame, type CharacterType } from "../game-context"
import { X } from "lucide-react"

export default function CharacterSelect() {
  const { isCharacterSelectOpen, setCharacterSelectOpen, selectedCharacter, setSelectedCharacter } = useGame()

  if (!isCharacterSelectOpen) return null

  const characters: { id: CharacterType; name: string }[] = [
    { id: "link", name: "Link" },
    { id: "mario", name: "Mario" },
    { id: "luigi", name: "Luigi" },
    { id: "toad", name: "Toad" },
    { id: "peach", name: "Princess Peach" },
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-amber-100 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border-4 border-amber-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-amber-900">Select Your Character</h3>
          <button onClick={() => setCharacterSelectOpen(false)} className="text-amber-900 hover:text-red-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {characters.map((character) => (
            <button
              key={character.id}
              onClick={() => {
                setSelectedCharacter(character.id)
                setCharacterSelectOpen(false)
              }}
              className={`p-4 border-2 flex flex-col items-center justify-center rounded-lg transition-colors ${
                selectedCharacter === character.id
                  ? "border-yellow-500 bg-yellow-100"
                  : "border-amber-700 hover:bg-amber-200"
              }`}
            >
              <div className="mb-2 h-16 flex items-center justify-center">
                <CharacterPreview type={character.id} />
              </div>
              <span className="text-amber-900 font-medium">{character.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Preview component for character selection
function CharacterPreview({ type }: { type: CharacterType }) {
  switch (type) {
    case "link":
      return <LinkCharacter />
    case "mario":
      return <MarioCharacter />
    case "luigi":
      return <LuigiCharacter />
    case "toad":
      return <ToadCharacter />
    case "peach":
      return <PeachCharacter />
  }
}

// Simple character previews
function LinkCharacter() {
  return (
    <div className="relative" style={{ width: "40px", height: "60px" }}>
      <div
        className="absolute w-0 h-0 left-[12px] top-[-8px]"
        style={{
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: "16px solid #4ade80",
        }}
      />
      <div className="absolute rounded-full bg-amber-200 w-[20px] h-[20px] left-[10px] top-[5px]">
        <div className="absolute w-[22px] h-[8px] bg-yellow-300 -top-[2px] -left-[1px] rounded-t-full" />
      </div>
      <div className="absolute rounded-md bg-green-500 w-[24px] h-[25px] left-[8px] top-[23px]">
        <div className="absolute w-full h-[4px] bg-amber-800 bottom-0" />
      </div>
      <div className="absolute bg-blue-700 w-[12px] h-[16px] rounded-t-md left-[4px] top-[25px] border border-yellow-500" />
    </div>
  )
}

function MarioCharacter() {
  return (
    <div className="relative" style={{ width: "40px", height: "60px" }}>
      <div className="absolute bg-red-600 w-[24px] h-[10px] left-[8px] top-[2px] rounded-t-full" />
      <div className="absolute bg-white w-[12px] h-[10px] left-[10px] top-[2px] rounded-full flex items-center justify-center">
        <div className="text-red-600 text-[8px] font-bold">M</div>
      </div>
      <div className="absolute rounded-full bg-[#e0ac69] w-[20px] h-[18px] left-[10px] top-[8px]">
        <div className="absolute bg-[#4a2511] w-[18px] h-[5px] bottom-[2px] left-[1px] rounded-b-lg" />
      </div>
      <div className="absolute bg-red-600 w-[24px] h-[20px] left-[8px] top-[25px] rounded-md" />
      <div className="absolute bg-blue-700 w-[24px] h-[12px] left-[8px] top-[33px] rounded-b-md" />
    </div>
  )
}

function LuigiCharacter() {
  return (
    <div className="relative" style={{ width: "40px", height: "60px" }}>
      <div className="absolute bg-green-600 w-[24px] h-[10px] left-[8px] top-[0px] rounded-t-full" />
      <div className="absolute bg-white w-[12px] h-[10px] left-[10px] top-[0px] rounded-full flex items-center justify-center">
        <div className="text-green-600 text-[8px] font-bold">L</div>
      </div>
      <div className="absolute rounded-full bg-[#e0ac69] w-[20px] h-[20px] left-[10px] top-[8px]">
        <div className="absolute bg-[#4a2511] w-[20px] h-[6px] bottom-[2px] left-[0px] rounded-b-lg" />
      </div>
      <div className="absolute bg-green-600 w-[24px] h-[20px] left-[8px] top-[27px] rounded-md" />
      <div className="absolute bg-blue-700 w-[24px] h-[12px] left-[8px] top-[35px] rounded-b-md" />
    </div>
  )
}

function ToadCharacter() {
  return (
    <div className="relative" style={{ width: "40px", height: "55px" }}>
      <div className="absolute bg-white w-[30px] h-[20px] left-[5px] top-[-5px] rounded-t-full" />
      <div className="absolute bg-red-500 w-[30px] h-[10px] left-[5px] top-[-5px] rounded-t-full">
        <div className="absolute bg-white w-[6px] h-[6px] left-[4px] top-[2px] rounded-full" />
        <div className="absolute bg-white w-[6px] h-[6px] right-[4px] top-[2px] rounded-full" />
      </div>
      <div className="absolute rounded-md bg-white w-[20px] h-[18px] left-[10px] top-[15px]" />
      <div className="absolute bg-blue-600 w-[24px] h-[18px] left-[8px] top-[30px] rounded-md" />
      <div className="absolute bg-red-500 w-[16px] h-[12px] left-[12px] top-[30px] rounded-md" />
    </div>
  )
}

function PeachCharacter() {
  return (
    <div className="relative" style={{ width: "40px", height: "60px" }}>
      <div className="absolute bg-yellow-500 w-[16px] h-[8px] left-[12px] top-[-5px] rounded-t-md">
        <div className="absolute bg-red-500 w-[4px] h-[4px] left-[6px] top-[2px] rounded-full" />
      </div>
      <div className="absolute bg-yellow-300 w-[24px] h-[20px] left-[8px] top-[3px] rounded-t-full" />
      <div className="absolute rounded-full bg-[#ffe0bd] w-[20px] h-[18px] left-[10px] top-[8px]" />
      <div className="absolute bg-pink-400 w-[24px] h-[15px] left-[8px] top-[25px] rounded-t-full" />
      <div className="absolute bg-pink-400 w-[30px] h-[20px] left-[5px] top-[38px] rounded-full" />
    </div>
  )
}

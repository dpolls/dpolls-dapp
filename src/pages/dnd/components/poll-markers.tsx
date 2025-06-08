"use client"

import { useGame } from "../game-context"
import { Sparkles } from "lucide-react"

export default function PollMarkers() {
  const { polls, handlePollClick, characterPosition } = useGame()

  return (
    <>
      {polls.map((poll) => {
        // Calculate distance to character for hover effect
        const distance = Math.sqrt(
          Math.pow(characterPosition.x - poll.position.x, 2) + Math.pow(characterPosition.y - poll.position.y, 2),
        )

        // Only show interactive cursor when character is close enough
        const isInteractive = distance < 15

        return (
          <div
            key={poll.key}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 ${
              isInteractive ? "cursor-pointer" : "cursor-default"
            }`}
            style={{
              left: `${poll.position.x}%`,
              top: `${poll.position.y}%`,
            }}
            onClick={() => handlePollClick(poll)}
          >
            <div className="relative">
              <div
                className={`bg-yellow-500 rounded-full p-1 shadow-lg ${
                  isInteractive ? "animate-pulse hover:scale-110 transition-transform" : ""
                }`}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div
                className={`absolute w-12 h-12 -inset-2 rounded-full opacity-30 ${
                  isInteractive ? "visible" : "invisible"
                }`}
                style={{
                  background: "radial-gradient(circle at center, rgba(234, 179, 8, 0.6), transparent 70%)",
                  animation: "pulse 2s infinite",
                }}
              />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="bg-amber-800 px-2 py-1 rounded text-xs whitespace-nowrap shadow-md border border-yellow-600 text-yellow-100">
                  Quest #{poll.key}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

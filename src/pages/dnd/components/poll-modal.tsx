"use client"

import { useGame } from "../game-context"
import { X, Scroll } from "lucide-react"

export default function PollModal() {
  const { activePoll, setActivePoll, votePoll, addToVisitedPolls } = useGame()

  if (!activePoll) return null

  const handleClose = () => {
    setActivePoll(null)
    // Ensure this poll is marked as visited when closed
    addToVisitedPolls(activePoll.key)
  }

  console.log("activePoll", activePoll)
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-amber-100 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border-4 border-amber-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-amber-900 flex items-center">
            <Scroll className="h-5 w-5 mr-2 text-amber-700" />
            {activePoll.subject}
          </h3>
          <button onClick={handleClose} className="text-amber-900 hover:text-red-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="space-y-2">
            {activePoll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  console.log("voting for option", option)
                  votePoll(activePoll.key, option)
                  // Ensure this poll is marked as visited when voted
                  addToVisitedPolls(activePoll.key)
                }}
                className="w-full text-left px-4 py-3 border-2 border-amber-700 rounded-md hover:bg-amber-200 transition-colors bg-amber-50 text-amber-900"
              >
                <div className="flex justify-between">
                  <span>{option}</span>
                  <span className="text-amber-700">{activePoll.votes.filter((vote: any) => vote === option).length} votes</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

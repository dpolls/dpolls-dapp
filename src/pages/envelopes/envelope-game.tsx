"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Envelope from "./envelope"
import PollLetter from "./poll-letter"
import confetti from 'canvas-confetti'

// Poll questions data
const polls = [
  {
    id: 1,
    question: "What's your favorite season?",
    options: ["Spring", "Summer", "Fall", "Winter"],
  },
  {
    id: 2,
    question: "Which pet would you prefer?",
    options: ["Dog", "Cat", "Bird", "Fish"],
  },
  {
    id: 3,
    question: "What's your favorite cuisine?",
    options: ["Italian", "Japanese", "Mexican", "Indian"],
  },
  {
    id: 4,
    question: "How do you prefer to travel?",
    options: ["Car", "Train", "Plane", "Boat"],
  },
  {
    id: 5,
    question: "What's your favorite hobby?",
    options: ["Reading", "Gaming", "Sports", "Cooking"],
  },
]

// Generate random position within the container
const generateRandomPosition = () => {
  return {
    x: Math.random() * 80 - 40, // percentage from center
    y: Math.random() * 80 - 40,
  }
}

interface EnvelopeGameProps {
  AAaddress: string
  handleTabChange: (tab: string) => void
  pollsSrc: any[]
  fetchPolls: () => void
  handleOptionVote: (poll: any, option: any) => void
}

export default function EnvelopeGame({ AAaddress, handleTabChange, pollsSrc, fetchPolls, handleOptionVote }: EnvelopeGameProps) {
  const [envelopes, setEnvelopes] = useState([])
  const [selectedPoll, setSelectedPoll] = useState(null)
  const [showLetter, setShowLetter] = useState(false)

  // Initialize envelopes with random positions
  useEffect(() => {
    const notVotedPolls = pollsSrc.filter((poll) => !poll.responsesWithAddress.some((response: any) => response.address === AAaddress))
    console.log("notVotedPolls", notVotedPolls)
    const initialEnvelopes = notVotedPolls.map((poll, index) => ({
      id: poll.id,
      poll,
      position: generateRandomPosition(),
      rotation: Math.random() * 20 - 10,
      speed: {
        x: (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
        y: (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
      },
    }))
    setEnvelopes(initialEnvelopes)
  }, [])

  // Update envelope positions for floating animation
  useEffect(() => {
    if (envelopes.length === 0 || showLetter) return

    const interval = setInterval(() => {
      setEnvelopes((prevEnvelopes) =>
        prevEnvelopes.map((envelope) => {
          let newX = envelope.position.x + envelope.speed.x
          let newY = envelope.position.y + envelope.speed.y

          // Bounce off the edges
          if (Math.abs(newX) > 40) {
            envelope.speed.x *= -1
            newX = envelope.position.x + envelope.speed.x
          }

          if (Math.abs(newY) > 40) {
            envelope.speed.y *= -1
            newY = envelope.position.y + envelope.speed.y
          }

          return {
            ...envelope,
            position: { x: newX, y: newY },
            rotation: envelope.rotation + (Math.random() * 0.4 - 0.2),
          }
        }),
      )
    }, 50)

    return () => clearInterval(interval)
  }, [envelopes, showLetter])

  const handleEnvelopeClick = (poll) => {
    console.log('selected poll', poll)
    setSelectedPoll(poll)
    setShowLetter(true)
  }

  const handleCloseClick = () => {
    setShowLetter(false)
    setSelectedPoll(null)
  }

  return (
    <div className="relative w-full max-w-4xl h-[600px] bg-sky-50 rounded-xl shadow-xl overflow-hidden border-2 border-sky-300">
      {/* Game container */}
      <div className="absolute inset-0">
        {/* Floating envelopes */}
        {envelopes.map((envelope) => (
          <Envelope
            key={envelope.id}
            position={envelope.position}
            rotation={envelope.rotation}
            onClick={() => handleEnvelopeClick(envelope.poll)}
            disabled={showLetter}
            handleOptionVote={handleOptionVote}
            fetchPolls={fetchPolls}
          />
        ))}
        {envelopes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-xl font-medium"
            >
              Hooray! You've opened all the envelopes.
            </motion.p>
          </div>
        )}
      </div>

      {/* Poll letter overlay */}
      <AnimatePresence>
        {showLetter && selectedPoll && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PollLetter poll={selectedPoll} onClose={handleCloseClick} fetchPolls={fetchPolls} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

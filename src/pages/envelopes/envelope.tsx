"use client"

import { motion } from "framer-motion"

interface EnvelopeProps {
  position: { x: number; y: number }
  rotation: number
  onClick: () => void
  disabled: boolean
  handleOptionVote: (poll: any, option: any) => void
  fetchPolls: () => void
}

export default function Envelope({ position, rotation, onClick, disabled, handleOptionVote, fetchPolls }: EnvelopeProps) {
  return (
    <motion.div
      className={`absolute top-1/2 left-1/2 w-20 h-16 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${disabled ? "pointer-events-none" : "hover:scale-110"}`}
      style={{
        x: `${position.x}%`,
        y: `${position.y}%`,
        rotate: rotation,
        zIndex: 1,
      }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Envelope body */}
      <div className="relative w-full h-full">
        {/* Envelope back */}
        <div className="absolute inset-0 bg-amber-100 rounded-md shadow-md border border-amber-300"></div>

        {/* Envelope flap (top) */}
        <div className="absolute top-0 left-0 w-full h-1/2 origin-bottom">
          <div
            className="absolute bottom-0 left-0 w-full h-full bg-amber-200 rounded-t-md border border-amber-300"
            style={{ clipPath: "polygon(0 100%, 50% 40%, 100% 100%)" }}
          ></div>
        </div>

        {/* Envelope front (bottom) */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-amber-50 rounded-b-md border border-amber-300"></div>

        {/* Letter inside */}
        <div className="absolute top-1/4 left-1/6 w-2/3 h-1/3 bg-white rounded-sm shadow-sm"></div>
      </div>
    </motion.div>
  )
}

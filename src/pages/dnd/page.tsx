"use client"

import { GameProvider } from "./game-context"
import GameMap from "./components/game-map"
import Character from "./components/character"
import PollMarkers from "./components/poll-markers"
import PollModal from "./components/poll-modal"
import CharacterSelect from "./components/character-select"
import { useGame } from "./game-context"
import { Button } from "antd"

function CharacterButton() {
  const { setCharacterSelectOpen } = useGame()

  return (
    <Button
      onClick={() => setCharacterSelectOpen(true)}
      className="absolute top-4 right-4 bg-amber-700 hover:bg-amber-800 text-white"
    >
      Change Character
    </Button>
  )
}

export default function DungeonsAndDragons({ AAaddress, handleTabChange, pollsSrc, fetchPolls, handleOptionVote }: 
  { AAaddress: string, handleTabChange: (tab: string) => void, pollsSrc: any[], fetchPolls: () => void, handleOptionVote: (poll: any, option: any) => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-stone-900">
      <h1 className="text-3xl font-bold mb-6 text-amber-300 font-serif">Legend of the Dungeon Polls</h1>
      <div className="relative w-full max-w-3xl aspect-square border-4 border-amber-800 rounded-lg overflow-hidden shadow-2xl">
        <GameProvider
          AAaddress={AAaddress}
          handleTabChange={handleTabChange}
          pollsSrc={pollsSrc}
          fetchPolls={fetchPolls}
          handleOptionVote={handleOptionVote}
        >
          <GameMap />
          <PollMarkers />
          <Character />
          <PollModal />
          <CharacterSelect />
          <CharacterButton />
        </GameProvider>
      </div>
      <p className="mt-4 text-amber-200 text-center max-w-md font-serif">
        Click anywhere in the dungeon to move your hero. Explore and discover magical quests!
      </p>
    </main>
  )
}

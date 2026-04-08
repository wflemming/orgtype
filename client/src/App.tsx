import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { GameBoard } from './components/GameBoard'
import { StartScreen } from './components/StartScreen'
import { AdminPage } from './admin/AdminPage'
import type { GameSession } from './types/employee'

function GamePage() {
  const [activeSession, setActiveSession] = useState<GameSession | null>(null)

  return (
    <div className="min-h-screen bg-sofi-bg flex flex-col items-center px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-sofi-dark tracking-tight">
          org<span className="text-sofi-purple">type</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Learn the team. Type the name.
        </p>
      </header>

      <main className="flex-1 w-full max-w-7xl">
        {activeSession ? (
          <GameBoard
            session={activeSession}
            onExit={() => setActiveSession(null)}
            onSessionUpdate={setActiveSession}
          />
        ) : (
          <StartScreen onStart={setActiveSession} />
        )}
      </main>

      <footer className="mt-12 flex flex-col items-center gap-2">
        <Link
          to="/admin"
          className="text-sofi-purple hover:text-sofi-purple-dark text-sm font-medium transition-colors"
        >
          Manage Org Charts →
        </Link>
        <span className="text-xs text-gray-300">
          Built with Kotlin + Spring Boot + React + TypeScript
        </span>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

// ---------- src/App.jsx ----------
import React, { useEffect, useState, useCallback } from 'react'

// Suits and ranks (stable order)
const SUITS = [
  { id: 'spades', label: 'Spades', emoji: '♠' },
  { id: 'hearts', label: 'Hearts', emoji: '♥' },
  { id: 'diamonds', label: 'Diamonds', emoji: '♦' },
  { id: 'clubs', label: 'Clubs', emoji: '♣' },
]
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const STORAGE_KEY = 'card-tracker-finished-v1'

export default function App() {
  // finished: { suitId: Set(rankIndex) }
  const [finished, setFinished] = useState(() => safeLoad())

  // Persist whenever finished changes
  useEffect(() => {
    try {
      const plain = {}
      for (const s of SUITS) plain[s.id] = Array.from(finished[s.id] || [])
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plain))
    } catch (err) {
      console.error('Failed to save to localStorage', err)
    }
  }, [finished])

  // Toggle a single card
  const toggle = useCallback((suitId, rankIdx) => {
    setFinished(prev => {
      const copy = {}
      for (const s of SUITS) copy[s.id] = new Set(prev[s.id] ? Array.from(prev[s.id]) : [])
      const setForSuit = copy[suitId]
      if (setForSuit.has(rankIdx)) setForSuit.delete(rankIdx)
      else setForSuit.add(rankIdx)
      return copy
    })
  }, [])

  // Mark full suit as finished
  const markSuit = suitId => {
    setFinished(prev => {
      const copy = {}
      for (const s of SUITS) copy[s.id] = new Set(prev[s.id] ? Array.from(prev[s.id]) : [])
      copy[suitId] = new Set(RANKS.map((_, i) => i))
      return copy
    })
  }

  // Clear suit
  const clearSuit = suitId => {
    setFinished(prev => {
      const copy = {}
      for (const s of SUITS) copy[s.id] = new Set(prev[s.id] ? Array.from(prev[s.id]) : [])
      copy[suitId] = new Set()
      return copy
    })
  }

  // Reset all
  const resetAll = () => setFinished(initialEmpty())

  // Keyboard handler: toggle card on Enter/Space when focused
  const onKeyToggle = (e, suitId, rankIdx) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(suitId, rankIdx)
    }
  }

  // Derived counts
  const totalFinished = SUITS.reduce((acc, s) => acc + (finished[s.id] ? finished[s.id].size : 0), 0)
  const totalCards = SUITS.length * RANKS.length

  return (
    <div className="app-root">
      <header className="topbar">
        <h1>Card Tracker</h1>
        <div className="controls">
          <button onClick={resetAll} className="btn btn-danger">Reset All</button>
        </div>
      </header>

      <section className="summary">
        <div className="progress-row">
          <div className="progress-label">Total: {totalFinished}/{totalCards}</div>
          <div className="progress-bar" aria-hidden>
            <div className="progress-fill" style={{ width: `${(totalFinished/totalCards)*100}%` }} />
          </div>
        </div>
        <div className="legend">
          <div className="legend-item"><span className="swatch finished"/> Finished</div>
          <div className="legend-item"><span className="swatch left"/> Left</div>
        </div>
      </section>

      <main className="grid-area" role="table" aria-label="Card grid">
        {/* We render as rows (13) and columns (4). Each row shows one rank across all suits. */}
        <div className="grid-header" role="row">
          <div className="cell header empty" />
          {SUITS.map(s => (
            <div key={s.id} className="cell header" role="columnheader">{s.emoji} {s.label}</div>
          ))}
        </div>

        {RANKS.map((rank, rankIdx) => (
          <div key={rank} className="grid-row" role="row">
            <div className="cell rank-cell" aria-hidden>{rank}</div>
            {SUITS.map(s => {
              const isFinished = Boolean(finished[s.id] && finished[s.id].has(rankIdx))
              return (
                <button
                  key={s.id}
                  role="cell"
                  aria-pressed={isFinished}
                  tabIndex={0}
                  onKeyDown={e => onKeyToggle(e, s.id, rankIdx)}
                  onClick={() => toggle(s.id, rankIdx)}
                  className={`cell card ${isFinished ? 'finished' : 'left'}`}
                  title={`${s.label} ${rank} — ${isFinished ? 'Finished' : 'Left'}`}
                >
                  <div className="cell-content">
                    <span className={`emoji ${s.id === 'hearts' || s.id === 'diamonds' ? 'red' : ''}`}>{s.emoji}</span>
                    <span className="rank">{rank}</span>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </main>

      {/* <aside className="suit-controls">
        {SUITS.map(s => (
          <div key={s.id} className="suit-control">
            <div className="suit-name">{s.emoji} {s.label}</div>
            <div className="suit-actions">
              <button className="btn" onClick={() => markSuit(s.id)}>Mark all</button>
              <button className="btn" onClick={() => clearSuit(s.id)}>Clear</button>
            </div>
          </div>
        ))}
      </aside> */}
    </div>
  )
}

// ---------- helpers ----------
function initialEmpty() {
  const obj = {}
  for (const s of SUITS) obj[s.id] = new Set()
  return obj
}

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialEmpty()
    const parsed = JSON.parse(raw)
    const out = {}
    for (const s of SUITS) {
      const arr = Array.isArray(parsed[s.id]) ? parsed[s.id] : []
      out[s.id] = new Set(arr.filter(n => Number.isInteger(n) && n >= 0 && n < RANKS.length))
    }
    return out
  } catch (err) {
    console.warn('Could not read saved state, starting fresh', err)
    return initialEmpty()
  }
}


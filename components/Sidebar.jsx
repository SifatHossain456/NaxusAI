'use client'
import { useState, useMemo } from 'react'

/* Group conversations by recency — like Claude.ai / ChatGPT */
function groupByDate(convs) {
  const now     = Date.now()
  const DAY     = 86_400_000
  const groups  = [
    { label: 'Today',          items: [] },
    { label: 'Yesterday',      items: [] },
    { label: 'Previous 7 Days',items: [] },
    { label: 'Older',          items: [] },
  ]
  for (const c of convs) {
    const age = now - c.createdAt
    if      (age < DAY)       groups[0].items.push(c)
    else if (age < 2 * DAY)   groups[1].items.push(c)
    else if (age < 7 * DAY)   groups[2].items.push(c)
    else                      groups[3].items.push(c)
  }
  return groups.filter(g => g.items.length > 0)
}

export default function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onToggle }) {
  const [hoverId, setHoverId] = useState(null)
  const groups = useMemo(() => groupByDate(conversations), [conversations])

  if (!open) return null

  return (
    <aside
      role="complementary"
      aria-label="Conversation sidebar"
      style={{
        width: 264, flexShrink: 0, height: '100vh',
        background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* ── Logo + collapse ── */}
      <header style={{
        padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 9,
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div
          className="logo-icon"
          style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6d5ce7, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}
          aria-hidden="true"
        >✦</div>

        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.025em' }}>
          <span className="gradient-text">NexusAI</span>
        </span>

        <button
          className="btn-icon"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          style={{ marginLeft: 'auto' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
        </button>
      </header>

      {/* ── New Chat ── */}
      <div style={{ padding: '10px 8px 4px', flexShrink: 0 }}>
        <button
          className="new-chat-btn"
          onClick={onNew}
          aria-label="Start a new chat (Ctrl+K)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          <span style={{ flex: 1 }}>New Chat</span>
          <span className="kbd">⌘K</span>
        </button>
      </div>

      {/* ── Conversation list ── */}
      <nav
        role="navigation"
        aria-label="Conversations"
        style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}
      >
        {conversations.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '32px 0' }}>
            No conversations yet
          </p>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              <p className="conv-group-label">{group.label}</p>
              <ul role="list" style={{ listStyle: 'none' }}>
                {group.items.map(conv => (
                  <li key={conv.id} role="listitem">
                    <div
                      className={`conv-item${conv.id === activeId ? ' active' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-current={conv.id === activeId ? 'true' : undefined}
                      aria-label={conv.title}
                      onClick={() => onSelect(conv.id)}
                      onKeyDown={e => e.key === 'Enter' && onSelect(conv.id)}
                      onMouseEnter={() => setHoverId(conv.id)}
                      onMouseLeave={() => setHoverId(null)}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          aria-hidden="true" style={{ flexShrink: 0, color: 'var(--t3)' }}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', flex: 1, fontSize: 13,
                        }}>
                          {conv.title}
                        </span>
                      </div>

                      {(hoverId === conv.id || conv.id === activeId) && (
                        <button
                          className="btn-icon"
                          style={{ padding: '2px 3px', flexShrink: 0 }}
                          onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
                          aria-label={`Delete "${conv.title}"`}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6m4-6v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      {/* ── Footer ── */}
      <footer style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
          Powered by Anthropic Claude
        </p>
      </footer>
    </aside>
  )
}

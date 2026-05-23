'use client'
import { useState, useMemo, useRef, useEffect } from 'react'

/* Group conversations by recency */
function groupByDate(convs) {
  const now  = Date.now()
  const DAY  = 86_400_000
  const bins = [
    { label: 'Today',           items: [] },
    { label: 'Yesterday',       items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older',           items: [] },
  ]
  for (const c of convs) {
    const age = now - c.createdAt
    if      (age < DAY)       bins[0].items.push(c)
    else if (age < 2 * DAY)   bins[1].items.push(c)
    else if (age < 7 * DAY)   bins[2].items.push(c)
    else                      bins[3].items.push(c)
  }
  return bins.filter(g => g.items.length > 0)
}

/* Inline rename input */
function RenameInput({ value, onSave, onCancel }) {
  const ref = useRef(null)
  const [val, setVal] = useState(value)

  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  function commit() { onSave(val) }
  function onKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commit() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <input
      ref={ref}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={onKey}
      style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        color: 'var(--t1)', fontSize: 13, fontFamily: 'inherit',
        minWidth: 0,
      }}
      aria-label="Rename conversation"
      maxLength={80}
    />
  )
}

export default function Sidebar({ open, isMobile, conversations, activeId, onSelect, onNew, onDelete, onRename, onToggle }) {
  const [hoverId,  setHoverId]  = useState(null)
  const [editingId, setEditingId] = useState(null)
  const groups = useMemo(() => groupByDate(conversations), [conversations])

  if (!open) return null

  return (
    <aside
      role="complementary"
      aria-label="Conversation sidebar"
      style={{
        width: 264, height: '100vh',
        background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        ...(isMobile
          ? { position: 'fixed', left: 0, top: 0, zIndex: 40, boxShadow: '6px 0 32px rgba(0,0,0,.6)' }
          : { flexShrink: 0 }
        ),
      }}
    >
      {/* ── Header ── */}
      <header style={{
        padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 9,
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div className="logo-icon" aria-hidden="true" style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#6d5ce7,#a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>✦</div>

        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.025em' }}>
          <span className="gradient-text">NexusAI</span>
        </span>

        <button className="btn-icon" onClick={onToggle} aria-label="Collapse sidebar" style={{ marginLeft: 'auto' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
        </button>
      </header>

      {/* ── New Chat ── */}
      <div style={{ padding: '10px 8px 4px', flexShrink: 0 }}>
        <button className="new-chat-btn" onClick={onNew} aria-label="New chat (Ctrl+K)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          <span style={{ flex: 1 }}>New Chat</span>
          <span className="kbd" aria-hidden="true">⌘K</span>
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
        ) : groups.map(group => (
          <div key={group.label}>
            <p className="conv-group-label" aria-hidden="true">{group.label}</p>
            <ul role="list" style={{ listStyle: 'none' }}>
              {group.items.map(conv => (
                <li key={conv.id} role="listitem">
                  <div
                    className={`conv-item${conv.id === activeId ? ' active' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-current={conv.id === activeId ? 'true' : undefined}
                    onClick={() => editingId !== conv.id && onSelect(conv.id)}
                    onKeyDown={e => e.key === 'Enter' && editingId !== conv.id && onSelect(conv.id)}
                    onMouseEnter={() => setHoverId(conv.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onDoubleClick={() => { setEditingId(conv.id) }}
                    title="Double-click to rename"
                    style={{ justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        aria-hidden="true" style={{ flexShrink: 0, color: 'var(--t3)' }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>

                      {editingId === conv.id ? (
                        <RenameInput
                          value={conv.title}
                          onSave={title => { onRename(conv.id, title); setEditingId(null) }}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', flex: 1, fontSize: 13,
                        }}>
                          {conv.title}
                        </span>
                      )}
                    </div>

                    {/* Action buttons — only when not renaming */}
                    {editingId !== conv.id && (hoverId === conv.id || conv.id === activeId) && (
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button
                          className="btn-icon"
                          style={{ padding: '2px 3px' }}
                          onClick={e => { e.stopPropagation(); setEditingId(conv.id) }}
                          aria-label={`Rename "${conv.title}"`}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className="btn-icon"
                          style={{ padding: '2px 3px' }}
                          onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
                          aria-label={`Delete "${conv.title}"`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6m4-6v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
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

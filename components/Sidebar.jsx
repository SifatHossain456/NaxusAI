'use client'
import { useState } from 'react'

export default function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onToggle }) {
  const [hoverId, setHoverId] = useState(null)

  if (!open) return null

  return (
    <div style={{
      width: 260, flexShrink: 0, height: '100vh',
      background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 9,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: '0 4px 14px rgba(99,102,241,.3)',
        }}>✦</div>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--t1)', letterSpacing: '-.02em' }}>
          NexusAI
        </span>
        <button onClick={onToggle} style={{
          marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--t3)',
          cursor: 'pointer', padding: 6, borderRadius: 7, display: 'flex',
          transition: 'color .15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      {/* New Chat */}
      <div style={{ padding: '10px 8px 4px' }}>
        <button onClick={onNew} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.03)', color: 'var(--t2)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .14s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--t1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {conversations.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '28px 0' }}>
            No conversations yet
          </p>
        ) : conversations.map(conv => (
          <div
            key={conv.id}
            className={`conv-item ${conv.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv.id)}
            onMouseEnter={() => setHoverId(conv.id)}
            onMouseLeave={() => setHoverId(null)}
            style={{ justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ flexShrink: 0, color: 'var(--t3)' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1, fontSize: 13,
              }}>
                {conv.title}
              </span>
            </div>

            {(hoverId === conv.id || conv.id === activeId) && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px',
                  color: 'var(--t3)', borderRadius: 4, flexShrink: 0, display: 'flex',
                  transition: 'color .14s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6m4-6v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
          Powered by Anthropic Claude
        </p>
      </div>
    </div>
  )
}

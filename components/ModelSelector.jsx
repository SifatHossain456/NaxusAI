'use client'
import { useState, useRef, useEffect } from 'react'

const TAG_COLORS = {
  Fast:  { bg: 'rgba(52,211,153,.12)', color: '#34d399' },
  Best:  { bg: 'rgba(139,120,248,.12)', color: '#a78bfa' },
  Power: { bg: 'rgba(251,191,36,.10)',  color: '#fbbf24' },
}

export default function ModelSelector({ models, value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref     = useRef(null)
  const current = models.find(m => m.id === value)

  /* Close on outside click */
  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  /* Close on Escape */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current model: ${current?.label}. Click to change.`}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 10,
          border: `1px solid ${open ? 'var(--border-2)' : 'var(--border)'}`,
          background: open ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          color: 'var(--t1)', fontSize: 13, fontWeight: 600,
          cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .6 : 1,
          transition: 'all .14s', fontFamily: 'inherit',
        }}
      >
        {/* Accent dot */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          boxShadow: open ? '0 0 8px var(--accent-glow)' : 'none',
          transition: 'box-shadow .2s',
        }} aria-hidden="true" />

        {current?.label}

        {/* Tag */}
        {current?.tag && (
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
            letterSpacing: '.06em', flexShrink: 0,
            ...TAG_COLORS[current.tag],
          }} aria-hidden="true">
            {current.tag}
          </span>
        )}

        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
          style={{ color: 'var(--t3)', transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          aria-label="Select a model"
          className="anim-scale-in"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
            minWidth: 250, listStyle: 'none',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-2)',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04)',
          }}
        >
          {models.map((m, i) => {
            const tagColor = TAG_COLORS[m.tag] ?? {}
            const isActive = m.id === value
            return (
              <li key={m.id} role="option" aria-selected={isActive}>
                <button
                  onClick={() => { onChange(m.id); setOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '13px 16px',
                    border: 'none', cursor: 'pointer', font: 'inherit',
                    background: isActive ? 'rgba(139,120,248,.1)' : 'transparent',
                    borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    borderBottom: i < models.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background .12s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
                      {m.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--t3)' }}>{m.desc}</p>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                    letterSpacing: '.06em', flexShrink: 0,
                    ...tagColor,
                  }}>
                    {m.tag}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

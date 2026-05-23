'use client'
import { useState, useRef, useEffect } from 'react'

export default function ModelSelector({ models, value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = models.find(m => m.id === value)

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.04)', cursor: disabled ? 'default' : 'pointer',
          color: 'var(--t1)', fontSize: 13, fontWeight: 600, opacity: disabled ? 0.65 : 1,
          transition: 'all .14s',
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        }} />
        {current?.label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ color: 'var(--t3)', transition: 'transform .14s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50, minWidth: 230,
          background: '#18181f', border: '1px solid var(--border)', borderRadius: 14,
          overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,.7)',
          animation: 'msgIn .15s ease',
        }}>
          {models.map(m => (
            <button key={m.id} onClick={() => { onChange(m.id); setOpen(false) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', border: 'none', cursor: 'pointer', transition: 'background .1s',
              background: m.id === value ? 'rgba(99,102,241,.12)' : 'transparent',
              borderLeft: `2px solid ${m.id === value ? 'var(--accent)' : 'transparent'}`,
            }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{m.label}</p>
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{m.desc}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                background: m.id === value ? 'rgba(99,102,241,.2)' : 'rgba(255,255,255,0.06)',
                color: m.id === value ? 'var(--accent)' : 'var(--t3)',
                letterSpacing: '.04em',
              }}>{m.badge}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

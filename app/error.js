'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[NexusAI] Error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1rem',
      background: 'var(--bg, #0a0a0f)',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⚠️</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f0f4ff' }}>
        Something went wrong
      </h1>
      <p style={{ marginBottom: '1.5rem', maxWidth: '24rem', fontSize: '0.875rem', color: '#4e4e70', lineHeight: 1.7 }}>
        {error.message || 'Failed to connect to Claude API. Check your API key and try again.'}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem',
            background: '#7c6ff1', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a href="/" style={{
          padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem',
          border: '1px solid #252540', color: '#4e4e70', textDecoration: 'none',
        }}>
          Go home
        </a>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1rem',
      background: 'var(--bg, #0a0a0f)',
    }}>
      <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--accent, #7c6ff1)', marginBottom: '1rem', lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f0f4ff' }}>
        Page not found
      </h1>
      <p style={{ marginBottom: '2rem', maxWidth: '24rem', fontSize: '0.875rem', color: '#4e4e70', lineHeight: 1.7 }}>
        This page doesn&apos;t exist. Head back to start a new conversation.
      </p>
      <Link href="/" style={{
        padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem',
        background: '#7c6ff1', color: '#fff', textDecoration: 'none',
      }}>
        Back to NexusAI
      </Link>
    </div>
  )
}

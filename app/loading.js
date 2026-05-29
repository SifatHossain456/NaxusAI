export default function Loading() {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: '1rem',
      }}
      role="status"
      aria-label="Loading"
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '2px solid #7c6ff1',
        borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: '0.875rem', color: '#4e4e70', fontWeight: 500 }}>Loading…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

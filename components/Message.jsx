'use client'
import { useState, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

/* ─── Language display names ─── */
const LANG_NAMES = {
  js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
  py: 'Python', python: 'Python', rs: 'Rust', go: 'Go',
  java: 'Java', c: 'C', cpp: 'C++', cs: 'C#', rb: 'Ruby',
  php: 'PHP', swift: 'Swift', kt: 'Kotlin', dart: 'Dart',
  css: 'CSS', html: 'HTML', json: 'JSON', yaml: 'YAML', yml: 'YAML',
  sql: 'SQL', bash: 'Bash', sh: 'Shell', md: 'Markdown', xml: 'XML',
  graphql: 'GraphQL', text: 'Plain Text',
}

/* ─── Relative time ─── */
function formatTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60_000)   return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/* ─── Copy button ─── */
function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      className={`copy-code-btn${copied ? ' copied' : ''}`}
      onClick={copy}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      {copied ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
      {copied ? 'Copied!' : label}
    </button>
  )
}

/* ─── Markdown components ─── */
const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const langKey   = (className || '').replace('language-', '').toLowerCase() || 'text'
    const langLabel = LANG_NAMES[langKey] ?? langKey
    const codeStr   = String(children).replace(/\n$/, '')

    if (inline) return <code className={className} {...props}>{children}</code>

    return (
      <div className="code-block" role="region" aria-label={`${langLabel} code block`}>
        <div className="code-header">
          <span className="code-lang">{langLabel}</span>
          <CopyBtn text={codeStr} label="Copy code" />
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={langKey}
          PreTag="div"
          showLineNumbers={codeStr.split('\n').length > 4}
          lineNumberStyle={{ color: '#333348', fontSize: 11, minWidth: 36, paddingRight: 14, userSelect: 'none' }}
          customStyle={{ margin: 0, borderRadius: 0, fontSize: 13, background: '#0e0e1a', padding: '14px 16px', lineHeight: 1.65 }}
          {...props}
        >
          {codeStr}
        </SyntaxHighlighter>
      </div>
    )
  },
}

/* ─── Message ─── */
function Message({ message, onRetry }) {
  const isUser  = message.role === 'user'
  const isEmpty = !message.content && message.streaming

  return (
    <article
      className="msg-wrap anim-fade-up"
      aria-label={isUser ? 'Your message' : 'NexusAI response'}
      style={{ display: 'flex', gap: 14, padding: '18px 0', borderBottom: '1px solid rgba(255,255,255,0.038)', alignItems: 'flex-start' }}
    >
      {/* Avatar */}
      <div aria-hidden="true" style={{
        width: 34, height: 34, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, userSelect: 'none',
        ...(isUser
          ? { background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-2)' }
          : { background: 'linear-gradient(135deg,#6d5ce7,#a78bfa)', boxShadow: '0 4px 16px rgba(139,120,248,.28)' }
        ),
      }}>
        {isUser ? '👤' : '✦'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>

        {/* Name + timestamp */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 7 }}>
          <p aria-hidden="true" style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            color: isUser ? 'var(--t3)' : 'var(--accent-2)',
          }}>
            {isUser ? 'You' : 'NexusAI'}
          </p>
          {message.createdAt && (
            <time
              dateTime={new Date(message.createdAt).toISOString()}
              style={{ fontSize: 11, color: 'var(--t3)', opacity: 0.7 }}
            >
              {formatTime(message.createdAt)}
            </time>
          )}
        </div>

        {/* Body */}
        {isUser ? (
          <p style={{ fontSize: 15, color: 'var(--t1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}>
            {message.content}
          </p>
        ) : (
          <>
            {isEmpty ? (
              <div className="dot-wrap" aria-label="NexusAI is thinking" role="status">
                <span className="dot" aria-hidden="true"/>
                <span className="dot" aria-hidden="true"/>
                <span className="dot" aria-hidden="true"/>
              </div>
            ) : message.isError ? (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 10,
                background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.2)',
                padding: '12px 16px', borderRadius: 12,
              }}>
                <p style={{ color: 'var(--red)', fontSize: 14 }}>
                  ⚠ {message.content}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    style={{
                      alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,.3)',
                      background: 'rgba(248,113,113,.08)', color: 'var(--red)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all .14s',
                    }}
                    aria-label="Retry this message"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                    </svg>
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <div className="prose">
                <ReactMarkdown components={mdComponents}>{message.content}</ReactMarkdown>
                {message.streaming && <span className="cursor" aria-label="generating"/>}
              </div>
            )}
          </>
        )}

        {/* Actions on hover */}
        <div className="msg-actions" role="toolbar" aria-label="Message actions">
          <CopyBtn text={message.content} label={isUser ? 'Copy' : 'Copy response'} />
          {!isUser && !message.streaming && !message.isError && onRetry && (
            <button
              className="copy-code-btn"
              onClick={onRetry}
              aria-label="Regenerate response"
              style={{ marginLeft: 2 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
              Regenerate
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default memo(Message)

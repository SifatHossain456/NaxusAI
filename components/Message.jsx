'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button className="copy-btn" onClick={copy}>
      {copied ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const lang    = (className || '').replace('language-', '') || 'text'
    const codeStr = String(children).replace(/\n$/, '')
    if (inline) return <code className={className} {...props}>{children}</code>
    return (
      <div className="code-block">
        <div className="code-header">
          <span className="code-lang">{lang}</span>
          <CopyBtn text={codeStr} />
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={lang}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0, fontSize: 13, background: '#12121c', padding: '14px 16px' }}
          {...props}
        >
          {codeStr}
        </SyntaxHighlighter>
      </div>
    )
  },
}

export default function Message({ message }) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content && message.streaming

  return (
    <div className="msg-in" style={{
      display: 'flex', gap: 14, padding: '18px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        ...(isUser
          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }
          : { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,.25)' }
        ),
      }}>
        {isUser ? '👤' : '✦'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--t3)',
          textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6,
        }}>
          {isUser ? 'You' : 'NexusAI'}
        </p>

        {isUser ? (
          <p style={{ fontSize: 15, color: 'var(--t1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65 }}>
            {message.content}
          </p>
        ) : (
          <>
            {isEmpty ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            ) : message.isError ? (
              <p style={{ color: 'var(--red)', fontSize: 14, fontStyle: 'italic' }}>{message.content}</p>
            ) : (
              <div className="prose">
                <ReactMarkdown components={mdComponents}>{message.content}</ReactMarkdown>
                {message.streaming && <span className="cursor" />}
              </div>
            )}
          </>
        )}

        {/* Copy button for completed AI messages */}
        {!isUser && !message.streaming && message.content && !message.isError && (
          <div style={{ marginTop: 10 }}>
            <CopyBtn text={message.content} />
          </div>
        )}
      </div>
    </div>
  )
}

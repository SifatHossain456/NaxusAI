import './globals.css'

export const metadata = {
  title: { default: 'NexusAI — AI Chat Powered by Claude', template: '%s — NexusAI' },
  description: 'AI-powered chat interface built on Claude — ask anything, get instant intelligent responses.',
  keywords: ['AI', 'chatbot', 'Claude', 'Anthropic', 'AI assistant', 'chat', 'NexusAI'],
  openGraph: {
    title: 'NexusAI — AI Chat Powered by Claude',
    description: 'AI-powered chat interface built on Claude — ask anything, get instant intelligent responses.',
    type: 'website',
    siteName: 'NexusAI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusAI — AI Chat Powered by Claude',
    description: 'AI-powered chat interface — ask anything, get instant intelligent responses.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

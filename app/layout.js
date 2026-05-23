import './globals.css'

export const metadata = {
  title: 'NexusAI',
  description: 'AI-powered chat interface built on Claude',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

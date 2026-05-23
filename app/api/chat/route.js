import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are NexusAI, a helpful, intelligent, and concise AI assistant. You provide clear, accurate, and thoughtful responses. Format answers with markdown when useful — headings, lists, bold text. For code, always use fenced code blocks with a language identifier (e.g. \`\`\`python).`

export async function POST(req) {
  const { messages, model = 'claude-sonnet-4-6' } = await req.json()

  if (!messages?.length) {
    return Response.json({ error: 'No messages' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model,
          max_tokens: 8192,
          system: [
            {
              type: 'text',
              text: SYSTEM,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages,
        })

        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            )
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (e) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`)
        )
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

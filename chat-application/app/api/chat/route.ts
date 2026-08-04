import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    messages,
  });

  return (await result).toDataStreamResponse();
}

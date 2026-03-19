import { GeminiProvider } from '@/lib/llm/gemini';

// Capture what startChat receives
let capturedHistory: unknown[] = [];
const mockSendMessageStream = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockImplementation((opts: { history: unknown[] }) => {
        capturedHistory = opts.history;
        return {
          sendMessageStream: mockSendMessageStream.mockResolvedValue({
            stream: (async function* () {
              yield {
                candidates: [
                  {
                    content: {
                      parts: [{ text: 'Test response' }],
                    },
                  },
                ],
              };
            })(),
            response: Promise.resolve({
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            }),
          }),
        };
      }),
    }),
  })),
}));

async function drainStream(provider: GeminiProvider, messages: { role: string; content: string }[]) {
  const gen = provider.streamChat({
    systemPrompt: 'You are a test assistant.',
    messages: messages as { role: 'user' | 'assistant'; content: string }[],
    tools: [],
  });
  const chunks = [];
  for await (const chunk of gen) {
    chunks.push(chunk);
  }
  return chunks;
}

describe('GeminiProvider - history filtering', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    capturedHistory = [];
    mockSendMessageStream.mockClear();
    provider = new GeminiProvider('fake-api-key');
  });

  it('strips leading assistant messages from history (the __INIT__ bug)', async () => {
    // Simulates: __INIT__ stored an assistant greeting, then user sends a message
    await drainStream(provider, [
      { role: 'assistant', content: 'Hello! Welcome to Elevate Offsites.' },
      { role: 'user', content: 'What packages do you offer?' },
    ]);

    // The assistant greeting should be stripped; history should be empty
    // because the only history msg (assistant) was removed, and the user msg
    // is sent via sendMessageStream, not in history.
    expect(capturedHistory).toEqual([]);
    expect(mockSendMessageStream).toHaveBeenCalledWith('What packages do you offer?');
  });

  it('strips multiple leading assistant messages', async () => {
    await drainStream(provider, [
      { role: 'assistant', content: 'Greeting 1' },
      { role: 'assistant', content: 'Greeting 2' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Response' },
      { role: 'user', content: 'Follow up' },
    ]);

    // Both leading assistant messages stripped; history keeps user+assistant+... (not the last msg)
    expect(capturedHistory).toEqual([
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Response' }] },
    ]);
    expect(mockSendMessageStream).toHaveBeenCalledWith('Follow up');
  });

  it('preserves history that already starts with a user message', async () => {
    await drainStream(provider, [
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'First answer' },
      { role: 'user', content: 'Second question' },
    ]);

    expect(capturedHistory).toEqual([
      { role: 'user', parts: [{ text: 'First question' }] },
      { role: 'model', parts: [{ text: 'First answer' }] },
    ]);
    expect(mockSendMessageStream).toHaveBeenCalledWith('Second question');
  });

  it('handles single user message with no history', async () => {
    // First ever message - __INIT__ or a fresh chat
    await drainStream(provider, [
      { role: 'user', content: 'Hi there' },
    ]);

    expect(capturedHistory).toEqual([]);
    expect(mockSendMessageStream).toHaveBeenCalledWith('Hi there');
  });

  it('handles longer conversation after __INIT__ greeting', async () => {
    // Realistic flow: __INIT__ greeting → user asks → assistant answers → user follows up
    await drainStream(provider, [
      { role: 'assistant', content: 'Welcome! I am Ava.' },
      { role: 'user', content: 'What destinations do you offer?' },
      { role: 'assistant', content: 'We offer Cape Town, Bali, and more.' },
      { role: 'user', content: 'Tell me about Cape Town' },
    ]);

    // Leading assistant stripped; rest preserved (minus the last user msg)
    expect(capturedHistory).toEqual([
      { role: 'user', parts: [{ text: 'What destinations do you offer?' }] },
      { role: 'model', parts: [{ text: 'We offer Cape Town, Bali, and more.' }] },
    ]);
    expect(mockSendMessageStream).toHaveBeenCalledWith('Tell me about Cape Town');
  });

  it('maps assistant role to model in history', async () => {
    await drainStream(provider, [
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'Q2' },
    ]);

    expect(capturedHistory[1]).toEqual({
      role: 'model',
      parts: [{ text: 'A1' }],
    });
  });

  it('yields text chunks from the stream', async () => {
    const chunks = await drainStream(provider, [
      { role: 'user', content: 'Hello' },
    ]);

    expect(chunks).toContainEqual({ type: 'text', content: 'Test response' });
  });

  it('tracks token usage after streaming', async () => {
    await drainStream(provider, [
      { role: 'user', content: 'Hello' },
    ]);

    const usage = provider.getTokenUsage();
    expect(usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    });
  });
});

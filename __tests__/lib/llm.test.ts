import { getLLMProvider } from '@/lib/llm';

// Mock the modules
jest.mock('@/lib/llm/gemini', () => ({
  GeminiProvider: jest.fn().mockImplementation(() => ({
    streamChat: jest.fn(),
    getTokenUsage: jest.fn().mockReturnValue({
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    }),
  })),
}));

jest.mock('@/lib/llm/claude', () => ({
  ClaudeProvider: jest.fn().mockImplementation(() => ({
    streamChat: jest.fn(),
    getTokenUsage: jest.fn().mockReturnValue({
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    }),
  })),
}));

describe('getLLMProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns a provider with streamChat and getTokenUsage methods', () => {
    process.env.LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';
    const provider = getLLMProvider();
    expect(provider).toHaveProperty('streamChat');
    expect(provider).toHaveProperty('getTokenUsage');
  });
});

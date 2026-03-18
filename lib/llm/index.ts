import type { LLMProvider } from '@/lib/types';
import { GeminiProvider } from './gemini';
import { ClaudeProvider } from './claude';

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerName = process.env.LLM_PROVIDER || 'gemini';

  switch (providerName) {
    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      cachedProvider = new GeminiProvider(apiKey);
      break;
    }
    case 'claude': {
      const apiKey = process.env.CLAUDE_API_KEY;
      if (!apiKey) {
        throw new Error('CLAUDE_API_KEY environment variable is required');
      }
      cachedProvider = new ClaudeProvider(apiKey);
      break;
    }
    default:
      throw new Error(
        `Unknown LLM provider: ${providerName}. Use "gemini" or "claude".`
      );
  }

  return cachedProvider;
}

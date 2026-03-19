import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  type Tool,
} from '@google/generative-ai';
import type {
  LLMProvider,
  ChatMessage,
  ToolDefinition,
  StreamChunk,
  TokenUsage,
} from '@/lib/types';

function toGeminiTools(tools: ToolDefinition[]): Tool[] {
  if (tools.length === 0) return [];
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as Record<string, unknown>,
      })),
    } as Tool,
  ];
}

export class GeminiProvider implements LLMProvider {
  private model: GenerativeModel;
  private tokenUsage: TokenUsage | null = null;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.model = genAI.getGenerativeModel({ model: modelName });
  }

  async *streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
  }): AsyncGenerator<StreamChunk> {
    this.tokenUsage = null;

    const history: Content[] = params.messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = params.messages[params.messages.length - 1];

    const geminiTools = toGeminiTools(params.tools);

    const chat = this.model.startChat({
      history,
      systemInstruction: { role: 'user', parts: [{ text: params.systemPrompt }] },
      tools: geminiTools.length > 0 ? geminiTools : undefined,
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const candidate = chunk.candidates?.[0];
      if (!candidate) continue;

      for (const part of candidate.content.parts) {
        if (part.text) {
          yield { type: 'text', content: part.text };
        }
        if (part.functionCall) {
          yield {
            type: 'tool_call',
            toolCall: {
              name: part.functionCall.name,
              arguments: part.functionCall.args as Record<string, unknown>,
            },
          };
        }
      }
    }

    const response = await result.response;
    const usage = response.usageMetadata;
    if (usage) {
      this.tokenUsage = {
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0,
      };
    }
  }

  getTokenUsage(): TokenUsage | null {
    return this.tokenUsage;
  }
}

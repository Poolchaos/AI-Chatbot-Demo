import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  ChatMessage,
  ToolDefinition,
  StreamChunk,
  TokenUsage,
} from '@/lib/types';

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private tokenUsage: TokenUsage | null = null;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
  }): AsyncGenerator<StreamChunk> {
    this.tokenUsage = null;

    const anthropicTools =
      params.tools.length > 0
        ? params.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters as Anthropic.Tool['input_schema'],
          }))
        : undefined;

    const stream = this.client.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: params.systemPrompt,
      messages: params.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      tools: anthropicTools,
    });

    let currentToolName = '';
    let currentToolInput = '';

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { type: 'text', content: event.delta.text };
      }

      if (
        event.type === 'content_block_start' &&
        event.content_block.type === 'tool_use'
      ) {
        currentToolName = event.content_block.name;
        currentToolInput = '';
      }

      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'input_json_delta'
      ) {
        currentToolInput += event.delta.partial_json;
      }

      if (event.type === 'content_block_stop' && currentToolName) {
        try {
          const args = JSON.parse(currentToolInput || '{}');
          yield {
            type: 'tool_call',
            toolCall: {
              name: currentToolName,
              arguments: args,
            },
          };
        } catch {
          // Malformed tool input — skip
        }
        currentToolName = '';
        currentToolInput = '';
      }

      if (event.type === 'message_delta' && event.usage) {
        this.tokenUsage = {
          prompt_tokens: 0,
          completion_tokens: event.usage.output_tokens || 0,
          total_tokens: event.usage.output_tokens || 0,
        };
      }
    }

    // Get final message for full usage
    const finalMessage = await stream.finalMessage();
    if (finalMessage.usage) {
      this.tokenUsage = {
        prompt_tokens: finalMessage.usage.input_tokens,
        completion_tokens: finalMessage.usage.output_tokens,
        total_tokens:
          finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      };
    }
  }

  getTokenUsage(): TokenUsage | null {
    return this.tokenUsage;
  }
}

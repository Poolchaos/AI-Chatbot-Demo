import type { SSEChunk } from '@/lib/types';

describe('SSEChunk types', () => {
  it('validates a text chunk', () => {
    const chunk: SSEChunk = { type: 'text', content: 'Hello' };
    expect(chunk.type).toBe('text');
    if (chunk.type === 'text') {
      expect(chunk.content).toBe('Hello');
    }
  });

  it('validates a lead_saved chunk', () => {
    const chunk: SSEChunk = { type: 'lead_saved', leadId: 'abc123' };
    expect(chunk.type).toBe('lead_saved');
  });

  it('validates a done chunk', () => {
    const chunk: SSEChunk = {
      type: 'done',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      sessionMessageCount: 5,
    };
    expect(chunk.type).toBe('done');
    if (chunk.type === 'done') {
      expect(chunk.usage.total_tokens).toBe(30);
      expect(chunk.sessionMessageCount).toBe(5);
    }
  });

  it('validates an error chunk', () => {
    const chunk: SSEChunk = {
      type: 'error',
      message: 'Rate limited',
      code: 'RATE_LIMITED',
    };
    expect(chunk.type).toBe('error');
  });

  it('validates a limit_warning chunk', () => {
    const chunk: SSEChunk = {
      type: 'limit_warning',
      kind: 'daily',
      percentUsed: 85,
    };
    expect(chunk.type).toBe('limit_warning');
    if (chunk.type === 'limit_warning') {
      expect(chunk.percentUsed).toBe(85);
    }
  });
});

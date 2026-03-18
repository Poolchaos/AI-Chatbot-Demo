import { buildSystemPrompt, SAVE_LEAD_TOOL } from '@/lib/prompt';

describe('buildSystemPrompt', () => {
  it('returns a non-empty system prompt string', () => {
    const prompt = buildSystemPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('includes the Elevate Offsites brand name', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('Elevate Offsites');
  });

  it('includes package pricing info', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/Urban|Nature|Executive/);
  });
});

describe('SAVE_LEAD_TOOL', () => {
  it('has the correct function name', () => {
    expect(SAVE_LEAD_TOOL.name).toBe('save_lead');
  });

  it('has required email parameter', () => {
    const params = SAVE_LEAD_TOOL.parameters;
    expect(params.required).toContain('email');
  });

  it('defines expected properties', () => {
    const props = SAVE_LEAD_TOOL.parameters.properties;
    expect(props).toHaveProperty('email');
    expect(props).toHaveProperty('name');
    expect(props).toHaveProperty('company_name');
    expect(props).toHaveProperty('estimated_headcount');
  });
});

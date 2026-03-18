/**
 * Server-side message guard: detects prompt injection, abuse, and off-topic
 * messages BEFORE they reach the LLM. This is the first line of defense -
 * the system prompt rules are the second.
 */

export interface GuardResult {
  blocked: boolean;
  reason?: string;
  response?: string;
}

const MAX_MESSAGE_LENGTH = 1000;

// ─── Prompt injection patterns ──────────────────────────────────────
// Each pattern is [regex, description]. Case-insensitive matching.
const INJECTION_PATTERNS: [RegExp, string][] = [
  // Direct instruction override attempts
  [/ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|rules?|prompts?|guidelines?)/i, 'instruction override'],
  [/disregard\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|rules?|prompts?)/i, 'instruction override'],
  [/forget\s+(all\s+)?(your|previous|prior)\s+(instructions?|rules?|prompts?|training)/i, 'instruction override'],
  [/override\s+(your|the|all)\s+(instructions?|rules?|prompts?|settings?|restrictions?)/i, 'instruction override'],

  // System prompt extraction
  [/(?:show|reveal|display|print|output|repeat|echo)\s+(?:your|the|full)?\s*(?:system\s*prompt|instructions?|rules?|guidelines?|initial\s*prompt)/i, 'prompt extraction'],
  [/what\s+(?:are|is|were)\s+your\s+(?:system\s*)?(?:instructions?|prompts?|rules?|guidelines?|directives?)/i, 'prompt extraction'],
  [/(?:copy|paste|dump|leak)\s+(?:your|the)\s+(?:system\s*)?(?:prompt|instructions?)/i, 'prompt extraction'],

  // Roleplay / identity override
  [/(?:you\s+are\s+now|from\s+now\s+on\s+you\s+are|act\s+as(?:\s+if)?|pretend\s+(?:to\s+be|you\s*(?:'re|are)))\s+(?:a\s+)?(?!interested|looking|planning)/i, 'identity override'],
  [/(?:roleplay|role-play)\s+as/i, 'identity override'],
  [/(?:switch|change)\s+(?:to|into)\s+(?:a\s+)?(?:different|new)\s+(?:mode|persona|role|character)/i, 'identity override'],

  // Known jailbreak techniques
  [/\bDAN\b.*(?:mode|jailbreak|anything\s+now)/i, 'jailbreak attempt'],
  [/\bjailbreak\b/i, 'jailbreak attempt'],
  [/\bdo\s+anything\s+now\b/i, 'jailbreak attempt'],
  [/\bdeveloper\s+mode\b/i, 'jailbreak attempt'],
  [/\bsudo\s+mode\b/i, 'jailbreak attempt'],
  [/\bgod\s*mode\b/i, 'jailbreak attempt'],
  [/\bbypass\b.*(?:filter|restriction|rule|safety|guard|limit)/i, 'bypass attempt'],
  [/\bdisable\b.*(?:filter|restriction|rule|safety|guard|content)/i, 'bypass attempt'],

  // Encoded/obfuscated injection
  [/\[SYSTEM\]/i, 'system tag injection'],
  [/\[INST\]/i, 'instruction tag injection'],
  [/<<\s*SYS\s*>>/i, 'system tag injection'],
  [/\bBEGIN\s+SYSTEM\s+MESSAGE\b/i, 'system tag injection'],
  [/\bEND\s+SYSTEM\s+MESSAGE\b/i, 'system tag injection'],
  [/```\s*system/i, 'system block injection'],

  // Prompt leaking via completion
  [/(?:complete|continue|finish)\s+(?:the|this)\s+(?:system\s*)?(?:prompt|sentence|message)\s*:\s*/i, 'prompt completion trick'],
  [/translate\s+(?:your|the)\s+(?:system\s*)?(?:instructions?|prompt|rules?)\s+(?:to|into)/i, 'prompt extraction via translation'],

  // Token manipulation
  [/\b(?:ignore|skip)\s+(?:the\s+)?(?:above|everything\s+above|all\s+of\s+that)\b/i, 'instruction override'],
];

// ─── Repetition / flood detection ───────────────────────────────────
function isFloodMessage(message: string): boolean {
  // Same character repeated excessively
  if (/(.)\1{30,}/.test(message)) return true;
  // Same word repeated excessively
  if (/\b(\w+)\b(?:\s+\1\b){10,}/i.test(message)) return true;
  return false;
}

// ─── Base64 detection (encoded injection payloads) ──────────────────
function containsSuspiciousEncoding(message: string): boolean {
  // Look for base64-like strings over 40 chars
  const b64Match = message.match(/[A-Za-z0-9+/=]{40,}/);
  if (b64Match) {
    try {
      const decoded = Buffer.from(b64Match[0], 'base64').toString('utf-8');
      // Check if decoded content contains injection patterns
      return INJECTION_PATTERNS.some(([pattern]) => pattern.test(decoded));
    } catch {
      return false;
    }
  }
  return false;
}

const BLOCKED_RESPONSE =
  "I'm here to help with corporate event planning for Elevate Offsites. What kind of retreat are you looking into?";

/**
 * Validates and screens a user message before it reaches the LLM.
 * Returns { blocked: false } if the message is safe to process.
 */
export function screenMessage(message: string): GuardResult {
  // Empty or whitespace-only
  const trimmed = message.trim();
  if (!trimmed || trimmed === '__INIT__') {
    return { blocked: false };
  }

  // Length limit
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      blocked: true,
      reason: 'message_too_long',
      response:
        'That message is a bit long for me to process. Could you keep it shorter? I work best with concise questions about our retreat packages and services.',
    };
  }

  // Flood / repetition
  if (isFloodMessage(trimmed)) {
    return {
      blocked: true,
      reason: 'flood',
      response: BLOCKED_RESPONSE,
    };
  }

  // Prompt injection patterns
  for (const [pattern, reason] of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        blocked: true,
        reason: `injection:${reason}`,
        response: BLOCKED_RESPONSE,
      };
    }
  }

  // Encoded payload check
  if (containsSuspiciousEncoding(trimmed)) {
    return {
      blocked: true,
      reason: 'injection:encoded_payload',
      response: BLOCKED_RESPONSE,
    };
  }

  return { blocked: false };
}

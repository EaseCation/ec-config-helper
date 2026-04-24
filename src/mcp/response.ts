import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface ToolEnvelope<T = unknown> {
  ok: boolean;
  paths?: Record<string, string | string[]>;
  summary?: Record<string, unknown>;
  data?: T;
  error?: string;
}

export function jsonToolResult<T>(payload: ToolEnvelope<T>): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    isError: !payload.ok,
  };
}

export async function runTool<T>(handler: () => Promise<ToolEnvelope<T>>): Promise<CallToolResult> {
  try {
    return jsonToolResult(await handler());
  } catch (error: any) {
    return jsonToolResult({
      ok: false,
      error: error?.message || String(error),
    });
  }
}

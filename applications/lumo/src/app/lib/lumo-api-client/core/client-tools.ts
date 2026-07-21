import type { ChatCompletionsFunctionTool } from '../../../types-api';

/** OpenAI-format tool call from a streamed client-side completion. */
export type PendingClientToolCall = {
    id: string;
    name: string;
    arguments: string;
};

/** Result of executing a client-side tool call. */
export type ClientToolResult = {
    content: string;
    is_error?: boolean;
};

/**
 * Product-supplied hook for client-side tool execution. Lumo Desktop registers a bridge
 * adapter; Mail/Drive register their own handlers via lumoAgent.
 *
 * Human-in-the-loop approval is not handled by the transport — products gate execution inside
 * `execute()` (e.g. show a confirm card for mutations before calling the handler).
 */
export interface ClientToolExecutor {
    /** Optional client function tools to advertise on the wire for this product. */
    getClientTools?(): Promise<ChatCompletionsFunctionTool[]>;
    /** Whether this executor handles the given tool name. */
    canExecute(name: string): boolean;
    /** Optionally normalize tool names before execution (e.g. alias hallucinations). */
    normalizeCalls?(calls: PendingClientToolCall[]): PendingClientToolCall[];
    /** Execute tool calls and return results in the same order. */
    execute(calls: PendingClientToolCall[]): Promise<ClientToolResult[]>;
}

export function filterClientToolCalls(
    calls: PendingClientToolCall[],
    executor: ClientToolExecutor
): PendingClientToolCall[] {
    const normalized = executor.normalizeCalls?.(calls) ?? calls;
    return normalized.filter((call) => executor.canExecute(call.name));
}

// Client tool calls can surface on two channels — the decrypted `server_tool_call` stream
// and the raw OpenAI `delta.tool_calls` — so merge both sources: drop calls with
// unparseable (e.g. still-encrypted) arguments, prefer the entry that carries real
// arguments when the same call_id appears twice, and collapse exact duplicates that
// arrive under different ids so a call is never executed twice.
export function mergePendingClientToolCalls(...sources: PendingClientToolCall[][]): PendingClientToolCall[] {
    const byId = new Map<string, PendingClientToolCall>();
    for (const call of sources.flat()) {
        if (!call.name) {
            continue;
        }
        try {
            JSON.parse(call.arguments || '{}');
        } catch {
            continue;
        }
        const existing = byId.get(call.id);
        const hasArgs = Boolean(call.arguments) && call.arguments !== '{}';
        if (!existing || hasArgs) {
            byId.set(call.id, call);
        }
    }

    const seen = new Set<string>();
    const merged: PendingClientToolCall[] = [];
    for (const call of byId.values()) {
        const key = `${call.name}:${call.arguments}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        merged.push(call);
    }
    return merged;
}

export function resolveClientToolExecutor(options: {
    clientToolExecutor?: ClientToolExecutor;
    createDefaultExecutor?: () => ClientToolExecutor | undefined;
}): ClientToolExecutor | undefined {
    if (options.clientToolExecutor) {
        return options.clientToolExecutor;
    }
    return options.createDefaultExecutor?.();
}

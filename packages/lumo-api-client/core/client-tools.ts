import type { ChatCompletionsFunctionTool } from '../types-api';

export type PendingClientToolCall = {
    id: string;
    name: string;
    arguments: string;
};

export type ClientToolResult = {
    content: string;
    is_error?: boolean;
    /**
     * Spends a round of the client-tool budget unless explicitly `false` — nothing to do with user
     * billing. Set `false` only for work that unblocks the model without advancing it (e.g. loading a
     * guide); a chain of free rounds still terminates on the total-round backstop.
     */
    billable?: boolean;
};

/**
 * Product-supplied hook for client-side tool execution. Lumo Desktop registers a bridge
 * adapter; Mail/Drive register their own handlers via lumoAgent.
 *
 * Human-in-the-loop approval is not handled by the transport — products gate execution inside
 * `execute()` (e.g. show a confirm card for mutations before calling the handler).
 */
export interface ClientToolExecutor {
    getClientTools?(): Promise<ChatCompletionsFunctionTool[]>;
    canExecute(name: string): boolean;
    normalizeCalls?(calls: PendingClientToolCall[]): PendingClientToolCall[];
    /** One result per call, in the same order; a short array is filled with per-call errors. */
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

function findExecutorForCall(
    executors: ClientToolExecutor[],
    call: PendingClientToolCall
): ClientToolExecutor | undefined {
    return executors.find((executor) => {
        return executor.canExecute(call.name);
    });
}

const missingClientToolResult = (call: PendingClientToolCall): ClientToolResult => {
    return {
        content: `No client tool executor registered for "${call.name}".`,
        is_error: true,
    };
};

/**
 * Merges multiple {@link ClientToolExecutor} instances so one request can advertise and run
 * several client-side tool families (e.g. Lumo Desktop connectors + create_artifact).
 */
export function composeClientToolExecutors(...executors: ClientToolExecutor[]): ClientToolExecutor {
    const activeExecutors = executors.filter(Boolean);
    if (activeExecutors.length === 0) {
        throw new Error('composeClientToolExecutors requires at least one executor');
    }

    const singleExecutor = activeExecutors[0];
    if (activeExecutors.length === 1 && singleExecutor) {
        return singleExecutor;
    }

    return {
        getClientTools: async () => {
            const toolLists = await Promise.all(
                activeExecutors.map((executor) => {
                    return executor.getClientTools?.() ?? [];
                })
            );
            const seenNames = new Set<string>();
            const mergedTools: ChatCompletionsFunctionTool[] = [];

            for (const tool of toolLists.flat()) {
                const name = tool.function.name;
                if (seenNames.has(name)) {
                    continue;
                }
                seenNames.add(name);
                mergedTools.push(tool);
            }

            return mergedTools;
        },
        canExecute: (name) => {
            return activeExecutors.some((executor) => {
                return executor.canExecute(name);
            });
        },
        normalizeCalls: (calls) => {
            return activeExecutors.reduce((normalizedCalls, executor) => {
                return executor.normalizeCalls?.(normalizedCalls) ?? normalizedCalls;
            }, calls);
        },
        execute: async (calls) => {
            const results: ClientToolResult[] = new Array(calls.length);
            let index = 0;

            while (index < calls.length) {
                const call = calls[index]!;
                const executor = findExecutorForCall(activeExecutors, call);
                if (!executor) {
                    results[index] = missingClientToolResult(call);
                    index++;
                    continue;
                }

                let batchEnd = index + 1;
                while (batchEnd < calls.length) {
                    const nextCall = calls[batchEnd]!;
                    const nextExecutor = findExecutorForCall(activeExecutors, nextCall);
                    if (nextExecutor !== executor) {
                        break;
                    }
                    batchEnd++;
                }

                const batch = calls.slice(index, batchEnd);
                const batchResults = await executor.execute(batch);
                for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
                    results[index + batchIndex] =
                        batchResults[batchIndex] ?? missingClientToolResult(batch[batchIndex]!);
                }
                index = batchEnd;
            }

            return results;
        },
    };
}

import { LumoApiClient } from './core/client';
import type { AssistantCallOptions, LumoApiClientConfig } from './core/types';
import type { Turn } from './types';

export async function callLumoAssistant(
    api: any,
    turns: Turn[],
    options: AssistantCallOptions & { config?: LumoApiClientConfig } = {}
): Promise<void> {
    const { config, ...assistantOptions } = options;
    const client = new LumoApiClient(config);
    await client.callAssistant(api, turns, assistantOptions);
}

export async function quickChat(
    api: any,
    message: string,
    options: {
        chunkCallback?: (content: string) => void;
        enableWebSearch?: boolean;
        config?: Partial<LumoApiClientConfig>;
        signal?: AbortSignal;
    } = {}
    // todo: consider including an optional system prompt as an argument or an option
): Promise<string> {
    const { config, chunkCallback, ...quickOptions } = options;
    const client = new LumoApiClient(config);
    return client.quickChat(api, message, {
        ...quickOptions,
        onChunk: chunkCallback,
    });
}

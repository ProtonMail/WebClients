import type { Api } from '@proton/shared/lib/interfaces';

import { LumoApiClient } from '../../lib/lumo-api-client/core/client';
import { buildCompactionPrompt } from './prompt';

export type SummarizeOptions = {
    signal?: AbortSignal;
    customInstructions?: string;
};

/**
 * Final compaction step: ask the model to summarize the (already token-reduced)
 * transcript into a compact, lossless summary. Runs as an isolated single-turn
 * request so it never pollutes the visible conversation. Tools are disabled.
 */
export async function summarizeWithLlm(api: Api, transcript: string, options: SummarizeOptions = {}): Promise<string> {
    const { signal, customInstructions } = options;
    const prompt = buildCompactionPrompt(transcript, customInstructions);

    const client = new LumoApiClient();
    const summary = await client.quickChat(api, prompt, {
        enableWebSearch: false,
        signal,
    });

    const trimmed = summary.trim();
    if (!trimmed) {
        throw new Error('Compaction summary was empty');
    }
    return trimmed;
}

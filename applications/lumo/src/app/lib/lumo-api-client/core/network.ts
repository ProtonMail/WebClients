import type { Api } from '@proton/shared/lib/interfaces';

import type { ChatCompletionsRequest } from './types';

export const LUMO_CHAT_ENDPOINT = 'ai/v1/chat/completions';

/**
 * Call the chat completions endpoint.
 */
export async function callChatEndpoint(
    api: Api,
    payload: ChatCompletionsRequest,
    options: {
        endpoint?: string;
        signal?: AbortSignal;
    } = {}
): Promise<ReadableStream> {
    const { endpoint, signal } = options;

    const finalEndpoint = endpoint || LUMO_CHAT_ENDPOINT;

    console.log('%c[Endpoint] Using endpoint: %c%s', 'color: blue; font-weight: bold', 'color: black', finalEndpoint);

    const response = await api({
        url: finalEndpoint,
        method: 'post',
        data: payload,
        signal,
        output: 'stream',
        silence: true,
        // The scheduler withholds response headers until the LLM accepts the job (or it fails
        // pre-stream). While the job waits for capacity, no bytes are sent, so the default 30s
        // time-to-headers timeout races the scheduler's own 30s queue-wait expiry. Since the
        // client timer starts first, it would win and surface a generic TimeoutError instead of
        // the scheduler's structured timeout response. Give the client a larger budget so the
        // scheduler's timeout (or a late accept) is what we act on.
        timeout: 60_000,
    });
    return response;
}

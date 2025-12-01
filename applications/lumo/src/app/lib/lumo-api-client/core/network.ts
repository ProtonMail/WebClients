import type { Api } from '@proton/shared/lib/interfaces';

import type { ChatEndpointGenerationRequest } from './types';

export const LUMO_CHAT_ENDPOINT = 'ai/v1/chat';

/**
 * Call the appropriate endpoint based on configuration
 */
export async function callChatEndpoint(
    api: Api,
    payload: ChatEndpointGenerationRequest,
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
    });
    return response;
}

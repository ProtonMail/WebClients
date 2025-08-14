import type { Api } from '@proton/shared/lib/interfaces';

/**
 * Call the appropriate endpoint based on configuration
 */
export async function callEndpoint(
    api: Api,
    payload: any,
    options: {
        endpoint?: string;
        signal?: AbortSignal;
    } = {}
): Promise<ReadableStream> {
    const { endpoint, signal } = options;

    const finalEndpoint = endpoint || 'ai/v1/chat';

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

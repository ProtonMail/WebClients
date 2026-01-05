import type { GenerationToFrontendMessage } from '../../../../types-api';
import type { ChunkCallback, GenerationToFrontendMessageDecrypted, ResponseContext } from '../types';

export const makeFinishSink = (
    notifyResponse: (
        value: GenerationToFrontendMessage,
        responseContext: ResponseContext
    ) => Promise<GenerationToFrontendMessage>,
    chunkCallback: ChunkCallback | undefined,
    responseContext: ResponseContext
): WritableStream<GenerationToFrontendMessageDecrypted> => {
    const start = Date.now();
    return new WritableStream({
        async write(value: GenerationToFrontendMessageDecrypted) {
            const elapsed = Date.now() - start;
            if (value.type === 'token_data') {
                console.log(`[sink] [${elapsed} ms] token_data (${value.target}): `, value.content);
            } else {
                console.log(`[sink] [${elapsed} ms] ${value.type}`);
            }
            const processedValue = await notifyResponse(value, responseContext);
            if (!chunkCallback) return;
            const result = await chunkCallback(processedValue);
            if (result?.error) {
                throw result.error;
            }
        },
    });
};

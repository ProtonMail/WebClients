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
    return new WritableStream({
        async write(value: GenerationToFrontendMessageDecrypted) {
            const processedValue = await notifyResponse(value, responseContext);
            if (!chunkCallback) return;
            const result = await chunkCallback(processedValue);
            if (result?.error) {
                throw result.error;
            }
        },
    });
};

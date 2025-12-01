import type {
    ChunkCallback,
    GenerationResponseMessage,
    GenerationResponseMessageDecrypted,
    ResponseContext,
} from '../types';

export const makeFinishSink = (
    notifyResponse: (
        value: GenerationResponseMessage,
        responseContext: ResponseContext
    ) => Promise<GenerationResponseMessage>,
    chunkCallback: ChunkCallback | undefined,
    responseContext: ResponseContext
): WritableStream<GenerationResponseMessageDecrypted> => {
    return new WritableStream({
        async write(value: GenerationResponseMessageDecrypted) {
            const processedValue = await notifyResponse(value, responseContext);
            if (!chunkCallback) return;
            await chunkCallback(processedValue);
        },
    });
};

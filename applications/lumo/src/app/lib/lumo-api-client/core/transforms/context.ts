import type { GenerationResponseMessageDecrypted, ResponseContext } from '../types';

const makeContextUpdaterTransformer = (
    responseContext: ResponseContext
): Transformer<GenerationResponseMessageDecrypted, GenerationResponseMessageDecrypted> => {
    return {
        transform(value: GenerationResponseMessageDecrypted, controller: TransformStreamDefaultController) {
            responseContext.chunkCount++;
            if (value.type === 'token_data') {
                responseContext.totalContentLength += value.content.length;
            }
            controller.enqueue(value);
        },
    };
};

export const makeContextUpdaterTransformStream = (
    responseContext: ResponseContext
): TransformStream<GenerationResponseMessageDecrypted, GenerationResponseMessageDecrypted> =>
    new TransformStream(makeContextUpdaterTransformer(responseContext));

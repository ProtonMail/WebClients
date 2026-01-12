import type { GenerationToFrontendMessageDecrypted, ResponseContext } from '../types';

const makeContextUpdaterTransformer = (
    responseContext: ResponseContext
): Transformer<GenerationToFrontendMessageDecrypted, GenerationToFrontendMessageDecrypted> => {
    return {
        transform(value: GenerationToFrontendMessageDecrypted, controller: TransformStreamDefaultController) {
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
): TransformStream<GenerationToFrontendMessageDecrypted, GenerationToFrontendMessageDecrypted> =>
    new TransformStream(makeContextUpdaterTransformer(responseContext));

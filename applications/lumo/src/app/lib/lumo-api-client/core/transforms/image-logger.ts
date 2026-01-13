import type { GenerationResponseMessage } from '../../../../types-api';

type M = GenerationResponseMessage;

const makeImageLoggerTransformer = (): Transformer<M, M> => ({
    transform(chunk: M, controller: TransformStreamDefaultController) {
        // Log image_data packets
        if (chunk.type === 'image_data') {
            const dataPreview = chunk.data ? `${chunk.data.substring(0, 50)}... (${chunk.data.length} chars)` : 'none';
            console.log('[IMAGE_DATA]', {
                image_id: chunk.image_id,
                data: dataPreview,
                is_final: chunk.is_final,
                seed: chunk.seed,
            });
        }
        controller.enqueue(chunk);
    },
});

export const makeImageLoggerTransformStream = (): TransformStream<M, M> =>
    new TransformStream(makeImageLoggerTransformer());

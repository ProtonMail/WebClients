import { StreamProcessor } from '../streaming';
import type { GenerationResponseMessage } from '../types';

const makeChunkParserTransformer = (): Transformer<string, GenerationResponseMessage> => {
    const processor = new StreamProcessor();
    return {
        transform(s: string, controller: TransformStreamDefaultController) {
            const parsedData = processor.processChunk(s);
            for (const chunk of parsedData) {
                controller.enqueue(chunk);
            }
        },
        flush(controller: TransformStreamDefaultController) {
            const parsedData = processor.finalize();
            for (const chunk of parsedData) {
                controller.enqueue(chunk);
            }
        },
    };
};

export const makeChunkParserTransformStream = (): TransformStream<string, GenerationResponseMessage> =>
    new TransformStream(makeChunkParserTransformer());

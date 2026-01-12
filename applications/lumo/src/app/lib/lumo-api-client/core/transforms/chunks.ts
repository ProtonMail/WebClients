import { StreamProcessor } from '../streaming';
import type { GenerationToFrontendMessage } from '../types';

const makeChunkParserTransformer = (): Transformer<string, GenerationToFrontendMessage> => {
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

export const makeChunkParserTransformStream = (): TransformStream<string, GenerationToFrontendMessage> =>
    new TransformStream(makeChunkParserTransformer());

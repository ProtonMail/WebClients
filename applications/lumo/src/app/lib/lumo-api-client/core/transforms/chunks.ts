import type { LumoCompletionTarget } from '../types';
import { StreamProcessor } from '../streaming';
import type { GenerationResponseMessage } from '../types';

const makeChunkParserTransformer = (
    defaultTarget: LumoCompletionTarget = 'message'
): Transformer<string, GenerationResponseMessage> => {
    const processor = new StreamProcessor(defaultTarget);
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

export const makeChunkParserTransformStream = (
    defaultTarget: LumoCompletionTarget = 'message'
): TransformStream<string, GenerationResponseMessage> => new TransformStream(makeChunkParserTransformer(defaultTarget));

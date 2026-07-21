import type { PendingClientToolCall } from '../client-tools';
import { StreamProcessor } from '../streaming';
import type { GenerationResponseMessage, LumoCompletionTarget } from '../types';

export type ChunkParserCapture = {
    stream: TransformStream<string, GenerationResponseMessage>;
    getPendingClientToolCalls: () => PendingClientToolCall[];
};

const makeChunkParserTransformerWithCapture = (
    processor: StreamProcessor
): Transformer<string, GenerationResponseMessage> => ({
    transform(s: string, controller: TransformStreamDefaultController<GenerationResponseMessage>) {
        const parsedData = processor.processChunk(s);
        for (const chunk of parsedData) {
            controller.enqueue(chunk);
        }
    },
    flush(controller: TransformStreamDefaultController<GenerationResponseMessage>) {
        const parsedData = processor.finalize();
        for (const chunk of parsedData) {
            controller.enqueue(chunk);
        }
    },
});

export const makeChunkParserTransformStream = (
    defaultTarget: LumoCompletionTarget = 'message'
): TransformStream<string, GenerationResponseMessage> =>
    new TransformStream(makeChunkParserTransformerWithCapture(new StreamProcessor(defaultTarget)));

export const makeChunkParserTransformStreamWithCapture = (
    defaultTarget: LumoCompletionTarget = 'message'
): ChunkParserCapture => {
    const processor = new StreamProcessor(defaultTarget);

    return {
        stream: new TransformStream(makeChunkParserTransformerWithCapture(processor)),
        // Unfiltered: under U2L the arguments are still ciphertext here and would fail the
        // JSON check in getCompleteToolCalls. They are decrypted downstream before execution.
        getPendingClientToolCalls: () => processor.getFinalizedToolCalls(),
    };
};

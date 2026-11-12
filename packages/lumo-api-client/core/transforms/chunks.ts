import type { PendingClientToolCall } from '../client-tools';
import { StreamProcessor } from '../streaming';
import type { GenerationResponseMessage, LumoCompletionTarget } from '../types';

export type ChunkParserCapture = {
    stream: TransformStream<string, GenerationResponseMessage>;
    getPendingClientToolCalls: () => PendingClientToolCall[];
};

const enqueueMessages = (
    messages: GenerationResponseMessage[],
    controller: TransformStreamDefaultController<GenerationResponseMessage>,
    stopAtDone: boolean
): void => {
    for (const message of messages) {
        controller.enqueue(message);
        if (stopAtDone && message.type === 'done') {
            controller.terminate();
            return;
        }
    }
};

const makeChunkParserTransformerWithCapture = (
    processor: StreamProcessor,
    stopAtDone: boolean
): Transformer<string, GenerationResponseMessage> => ({
    transform(s: string, controller: TransformStreamDefaultController<GenerationResponseMessage>) {
        enqueueMessages(processor.processChunk(s), controller, stopAtDone);
    },
    flush(controller: TransformStreamDefaultController<GenerationResponseMessage>) {
        enqueueMessages(processor.finalize(), controller, stopAtDone);
    },
});

export const makeChunkParserTransformStreamWithCapture = (
    defaultTarget: LumoCompletionTarget = 'message',
    stopAtDone = false
): ChunkParserCapture => {
    const processor = new StreamProcessor(defaultTarget);

    return {
        stream: new TransformStream(makeChunkParserTransformerWithCapture(processor, stopAtDone)),
        // Unfiltered: under U2L the arguments are still ciphertext here and would fail the
        // JSON check in getCompleteToolCalls. They are decrypted downstream before execution.
        getPendingClientToolCalls: () => processor.getFinalizedToolCalls(),
    };
};

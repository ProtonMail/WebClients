type Bytes = Uint8Array<ArrayBuffer>;

const makeAbortTransformer = (signal: AbortSignal | undefined): Transformer<Bytes, Bytes> => ({
    transform(chunk: Bytes, controller: TransformStreamDefaultController) {
        if (signal?.aborted) {
            controller.error(new DOMException('Aborted', 'AbortError'));
            return;
        }
        controller.enqueue(chunk);
    },
});

export const makeAbortTransformStream = (signal: AbortSignal | undefined): TransformStream<Bytes, Bytes> =>
    new TransformStream(makeAbortTransformer(signal));

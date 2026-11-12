type Bytes = Uint8Array<ArrayBuffer>;

const makeUtf8DecodingTransformer = (): Transformer<Bytes, string> => {
    const decoder = new TextDecoder('utf-8');
    return {
        transform(bytes: Bytes, controller: TransformStreamDefaultController) {
            const decoded = decoder.decode(bytes, { stream: true });
            if (decoded === '') return;
            controller.enqueue(decoded);
        },
        flush(controller) {
            const decoded = decoder.decode();
            if (decoded !== '') {
                controller.enqueue(decoded);
            }
        },
    };
};
export const makeUtf8DecodingTransformStream = (): TransformStream<Bytes, string> =>
    new TransformStream(makeUtf8DecodingTransformer());

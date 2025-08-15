const needsStreamsPolyfill = (): boolean => {
    const hasReadableStream = typeof window.ReadableStream !== 'undefined';
    const hasWritableStream = typeof window.WritableStream !== 'undefined';
    const hasTransformStream = typeof window.TransformStream !== 'undefined';

    let firefoxVersion = 0;
    const firefoxMatch = navigator.userAgent.match(/Firefox\/(\d+)/);
    if (firefoxMatch && firefoxMatch[1]) {
        firefoxVersion = parseInt(firefoxMatch[1], 10);
    }

    const isOldFirefox = navigator.userAgent.includes('Firefox') && firefoxVersion < 102;

    return !hasReadableStream || !hasWritableStream || !hasTransformStream || isOldFirefox;
};

const needStreamsPolyfill = needsStreamsPolyfill();

export const loadStreamsPolyfill = async (): Promise<void> => {
    if (needStreamsPolyfill) {
        try {
            await import(
                /* webpackChunkName: "web-streams-polyfill" */
                'web-streams-polyfill/polyfill/es5'
            );
        } catch (error) {
            console.error('Failed to load web-streams-polyfill:', error);
            throw error;
        }
    }
};

export const loadCreateReadableStreamWrapper = async (
    stream: ReadableStream<Uint8Array<ArrayBuffer>>
): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> => {
    if (needStreamsPolyfill) {
        const { createReadableStreamWrapper } = await import(
            /* webpackChunkName: "web-streams-adapter" */
            '@mattiasbuelens/web-streams-adapter'
        );
        const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);
        return toPolyfillReadable(stream) as ReadableStream<Uint8Array<ArrayBuffer>>;
    }
    return stream;
};

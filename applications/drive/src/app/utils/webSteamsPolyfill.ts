const needsStreamsPolyfill = (): boolean => {
    const hasReadableStream = typeof window.ReadableStream !== 'undefined';
    const hasWritableStream = typeof window.WritableStream !== 'undefined';
    const hasTransformStream = typeof window.TransformStream !== 'undefined';

    let firefoxVersion = 0;
    const firefoxMatch = navigator.userAgent.match(/Firefox\/(\d+)/);
    if (firefoxMatch && firefoxMatch[1]) {
        firefoxVersion = parseInt(firefoxMatch[1], 10);
    }

    const isOldFirefox = navigator.userAgent.includes('Firefox') && firefoxVersion < 100;

    return !hasReadableStream || !hasWritableStream || !hasTransformStream || isOldFirefox;
};

export const loadStreamsPolyfill = async (): Promise<void> => {
    if (needsStreamsPolyfill()) {
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

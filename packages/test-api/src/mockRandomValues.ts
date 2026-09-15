type TypedArray =
    | Int8Array
    | Uint8Array<ArrayBuffer>
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array;
let original: undefined | typeof crypto.getRandomValues;

/**
 * Mock crypto.getRandomValues using the mocked implementation (if given). Otherwise,
 * a deterministic function will fill the buffer with consecutive values from 0 up to 254.
 */
export const initRandomMock = <T extends TypedArray>(mockedImplementation?: (buf: T) => T) => {
    if (!original) {
        original = crypto.getRandomValues;
    }

    if (mockedImplementation) {
        // @ts-ignore DataView not supported
        crypto.getRandomValues = mockedImplementation;
    } else {
        const staticMockRandomValues = (buf: TypedArray) => {
            for (let i = 0; i < Math.min(buf.length, 255); ++i) {
                // values wrap around automatically based on the provided typed array
                buf[i] = i;
            }
            return buf;
        };
        // @ts-ignore DataView not supported
        crypto.getRandomValues = staticMockRandomValues;
    }
};

export const disableRandomMock = () => {
    if (!original) {
        throw new Error('mock was not initialized');
    }
    crypto.getRandomValues = original;
    original = undefined;
};

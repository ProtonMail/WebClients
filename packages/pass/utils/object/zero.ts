/** Recursively zeroes all `Uint8Array` buffers in an object tree. This mutates
 * buffers in-place, meaning any code still holding a reference to a zeroed buffer
 * will see corrupted data. Never hold references to zeroizable buffers across
 * async boundaries (eg. saga yields, promise chains). */
export const zeroize = (obj: unknown): void => {
    if (!obj || typeof obj !== 'object') return;
    else if (ArrayBuffer.isView(obj)) (obj as Uint8Array<ArrayBuffer>)?.fill(0);
    else if (Array.isArray(obj)) for (let i = 0; i < obj.length; i++) zeroize(obj[i]);
    else {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) zeroize((obj as Record<string, unknown>)[keys[i]]);
    }
};

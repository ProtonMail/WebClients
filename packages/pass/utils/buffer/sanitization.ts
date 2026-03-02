import { isObject } from '@proton/pass/utils/object/is-object';

import { objectMap } from '../object/map';

type ByteArrays = ArrayBuffer | ArrayBufferView | Uint8Array<ArrayBuffer>;

export type SanitizedBuffers<T, BytesAs> = T extends ByteArrays
    ? BytesAs
    : T extends (infer U)[]
      ? SanitizedBuffers<U, BytesAs>[]
      : T extends object
        ? { [K in keyof T]: SanitizedBuffers<T[K], BytesAs> }
        : T;

const isArrayBuffer = (value: unknown): value is ArrayBuffer =>
    value instanceof ArrayBuffer || (typeof window !== 'undefined' && value instanceof window.ArrayBuffer);

const isUint8Array = (value: unknown): value is Uint8Array<ArrayBuffer> =>
    value instanceof Uint8Array || (typeof window !== 'undefined' && value instanceof window.Uint8Array);

const isInt8Array = (value: unknown): value is Int8Array =>
    value instanceof Int8Array || (typeof window !== 'undefined' && value instanceof window.Int8Array);

export const SafeUint8Array = typeof window !== 'undefined' ? window.Uint8Array : Uint8Array;

/** If this function is invoked within a content-script, use constructors
 * from the window object to mitigate privilege errors in Firefox add-ons */
export const sanitizeBuffers = <T>(value: T): SanitizedBuffers<T, number[]> => {
    if (isArrayBuffer(value)) return Array.from(new SafeUint8Array(value)) as SanitizedBuffers<T, number[]>;
    if (isUint8Array(value)) return Array.from(value) as SanitizedBuffers<T, number[]>;
    if (isInt8Array(value)) return Array.from(new SafeUint8Array(value)) as SanitizedBuffers<T, number[]>;
    if (Array.isArray(value)) return value.map(sanitizeBuffers) as SanitizedBuffers<T, number[]>;
    if (isObject(value)) return objectMap(value, (_, val) => sanitizeBuffers(val)) as SanitizedBuffers<T, number[]>;
    return value as SanitizedBuffers<T, number[]>;
};

/** `Uint8Array.toBase64` may not be polyfilled in certain extension contexts
 * (eg content-scripts where the polyfill runs in an isolated world). These
 * manual btoa-based helpers serve as the fallback when the API is unavailable. */
export const uint8ArrayToB64 = (buffer: Uint8Array<ArrayBuffer>): string => {
    let binary = '';
    for (const byte of buffer) binary += String.fromCharCode(byte);
    return btoa(binary);
};

export const uint8ArrayToB64URL = (buffer: Uint8Array<ArrayBuffer>): string =>
    uint8ArrayToB64(buffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sanitizeBuffersB64Factory = (alphabet: 'base64' | 'base64url') => {
    const b64 = (buffer: Uint8Array<ArrayBuffer>): string => {
        const omitPadding = alphabet === 'base64url';
        if ('toBase64' in Uint8Array.prototype) return buffer.toBase64({ alphabet, omitPadding });
        return (alphabet === 'base64url' ? uint8ArrayToB64URL : uint8ArrayToB64)(buffer);
    };

    const sanitizer = <T>(val: T): SanitizedBuffers<T, string> => {
        if (isArrayBuffer(val)) return b64(new SafeUint8Array(val)) as SanitizedBuffers<T, string>;
        if (isUint8Array(val)) return b64(val) as SanitizedBuffers<T, string>;
        if (isInt8Array(val)) return b64(new SafeUint8Array(val)) as SanitizedBuffers<T, string>;
        if (Array.isArray(val)) return val.map(sanitizer) as SanitizedBuffers<T, string>;
        if (isObject(val)) return objectMap(val, (_, v) => sanitizer(v)) as SanitizedBuffers<T, string>;
        return val as SanitizedBuffers<T, string>;
    };

    return sanitizer;
};

export const sanitizeBuffersB64 = sanitizeBuffersB64Factory('base64');
export const sanitizeBuffersB64URL = sanitizeBuffersB64Factory('base64url');

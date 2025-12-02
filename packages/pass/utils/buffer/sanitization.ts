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

export const sanitizeBuffersB64 = <T>(value: T): SanitizedBuffers<T, string> => {
    if (isArrayBuffer(value)) return new SafeUint8Array(value).toBase64() as SanitizedBuffers<T, string>;
    if (isUint8Array(value)) return value.toBase64() as SanitizedBuffers<T, string>;
    if (isInt8Array(value)) return new SafeUint8Array(value).toBase64() as SanitizedBuffers<T, string>;
    if (Array.isArray(value)) return value.map(sanitizeBuffersB64) as SanitizedBuffers<T, string>;
    if (isObject(value)) return objectMap(value, (_, val) => sanitizeBuffersB64(val)) as SanitizedBuffers<T, string>;
    return value as SanitizedBuffers<T, string>;
};

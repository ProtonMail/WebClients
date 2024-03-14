import { isObject } from '@proton/pass/utils/object/is-object';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { objectMap } from '../object/map';

type ByteArrays = ArrayBuffer | ArrayBufferView | Uint8Array;

export type SanitizedBuffers<T> = T extends ByteArrays
    ? string
    : T extends (infer U)[]
      ? SanitizedBuffers<U>[]
      : T extends object
        ? { [K in keyof T]: SanitizedBuffers<T[K]> }
        : T;

const isArrayBuffer = (value: unknown): value is ArrayBuffer =>
    value instanceof ArrayBuffer || value instanceof window.ArrayBuffer;

const isUint8Array = (value: unknown): value is Uint8Array =>
    value instanceof Uint8Array || value instanceof window.Uint8Array;

/** If this function is invoked within a content-script, use constructors
 * from the window object to mitigate privilege errors in Firefox add-ons */
export const sanitizeBuffers = <T>(value: T): SanitizedBuffers<T> => {
    if (isArrayBuffer(value)) return uint8ArrayToBase64String(new window.Uint8Array(value)) as SanitizedBuffers<T>;
    else if (isUint8Array(value)) return uint8ArrayToBase64String(value) as SanitizedBuffers<T>;
    else if (Array.isArray(value)) return value.map(sanitizeBuffers) as SanitizedBuffers<T>;
    else if (isObject(value)) return objectMap(value, (_, val) => sanitizeBuffers(val)) as SanitizedBuffers<T>;
    return value as SanitizedBuffers<T>;
};

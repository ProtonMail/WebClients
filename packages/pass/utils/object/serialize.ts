import { isObject } from './is-object';

const BYTE_ARRAY_FLAG = '_$u8_';

export const serialize = (state: unknown): string =>
    JSON.stringify(state, (_, value) => {
        if (value instanceof Uint8Array) return { [BYTE_ARRAY_FLAG]: value.toBase64() };
        return value;
    });

export const deserialize = <T>(json: string): T =>
    JSON.parse(json, (_, value) => {
        if (isObject(value) && BYTE_ARRAY_FLAG in value) return Uint8Array.fromBase64((value as any)[BYTE_ARRAY_FLAG]);
        return value;
    });

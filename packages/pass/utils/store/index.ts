import { utf8StringToUint8Array, uint8ArrayToUtf8String } from '@proton/crypto/lib/utils';
import type { Maybe, Store } from '@proton/pass/types';

export const encodedGetter = (store: Store) => (key: string) => (): Maybe<string> => {
    const value = store.get(key);
    return value ? uint8ArrayToUtf8String(Uint8Array.fromBase64(value)) : undefined;
};

export const encodedSetter = (store: Store) => (key: string) => (value: Maybe<string>) =>
    store.set(key, value ? utf8StringToUint8Array(value).toBase64() : undefined);

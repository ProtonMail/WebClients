import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import type { Maybe, Store } from '@proton/pass/types';

export const encodedGetter =
    (store: Store) =>
    <T>(key: string, defaultValue: T) =>
    (): string | T => {
        const value = store.get(key);
        return decodeUtf8Base64(value) ?? defaultValue;
    };

export const encodedSetter = (store: Store) => (key: string) => (value: Maybe<string>) =>
    store.set(key, encodeUtf8Base64(value) ?? undefined);

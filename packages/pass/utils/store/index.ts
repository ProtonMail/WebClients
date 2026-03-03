import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@proton/crypto/lib/utils';
import type { Maybe, Store } from '@proton/pass/types';
import { coalesce } from '@proton/pass/utils/fp/control';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';

export const createMemoryStore = (): Store & { subscribe: (subscriber: () => void) => () => void } => {
    let state: Record<string, any> = {};
    const pubsub = createPubSub<void>();
    const notify = coalesce(() => pubsub.publish());

    return {
        get: (key) => state[key],
        set: (key, data) => {
            state[key] = data;
            notify();
        },
        reset: () => {
            state = {};
            notify();
        },

        subscribe: pubsub.subscribe,
    };
};

export const encodedGetter = (store: Store) => (key: string) => (): Maybe<string> => {
    const value = store.get(key);
    return value ? uint8ArrayToUtf8String(Uint8Array.fromBase64(value)) : undefined;
};

export const encodedSetter = (store: Store) => (key: string) => (value: Maybe<string>) =>
    store.set(key, value ? utf8StringToUint8Array(value).toBase64() : undefined);

import { decryptData, getCacheEncryptionKey } from '@proton/pass/crypto/utils';
import type { Maybe, PassCryptoSnapshot, SerializedCryptoContext } from '@proton/pass/types';
import { EncryptionTag } from '@proton/pass/types';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import type { EncryptedExtensionCache, ExtensionCache } from '../../../types/worker/cache';
import type { State } from '../../types';

const decrypt = async <T extends object>(options: {
    data: string | null;
    key: CryptoKey;
    useTextDecoder: boolean;
}): Promise<T | undefined> => {
    if (!options.data) {
        return;
    }

    try {
        const encryptedData = stringToUint8Array(options.data);
        const decryptedData = await decryptData(options.key, encryptedData, EncryptionTag.Cache);

        const decoder = new TextDecoder();
        return JSON.parse(
            options.useTextDecoder ? decoder.decode(decryptedData) : uint8ArrayToString(decryptedData)
        ) as T;
    } catch (_) {}
};

export const decryptCachedState = async (
    { state: encryptedState, snapshot: encryptedSnapshot, salt }: Partial<EncryptedExtensionCache>,
    sessionLockToken: Maybe<string>
): Promise<Maybe<ExtensionCache>> => {
    if (encryptedState && encryptedSnapshot && salt) {
        const cacheKey = await getCacheEncryptionKey(stringToUint8Array(salt), sessionLockToken);

        const [state, snapshot] = await Promise.all([
            decrypt<State>({ data: encryptedState, key: cacheKey, useTextDecoder: true }),
            decrypt<SerializedCryptoContext<PassCryptoSnapshot>>({
                data: encryptedSnapshot,
                key: cacheKey,
                useTextDecoder: false,
            }),
        ]);

        return state !== undefined && snapshot !== undefined ? { state, snapshot } : undefined;
    }
};

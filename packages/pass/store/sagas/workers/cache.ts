import { decryptData, getCacheEncryptionKey } from '@proton/pass/crypto/utils';
import type { Maybe, PassCryptoSnapshot, SerializedCryptoContext } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { deobfuscateItem, obfuscateItem } from '@proton/pass/utils/pass/items';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import type { EncryptedExtensionCache, ExtensionCache } from '../../../types/worker/cache';
import type { ItemsByShareId } from '../../reducers';
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
        const decryptedData = await decryptData(options.key, encryptedData, PassEncryptionTag.Cache);

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

        if (state !== undefined && snapshot !== undefined) {
            /* reobfuscate each cached item with a new mask */
            for (const [shareId, items] of Object.entries(state.items.byShareId as ItemsByShareId)) {
                for (const item of Object.values(items)) {
                    if ('itemId' in item) {
                        state.items.byShareId[shareId][item.itemId] = {
                            ...item,
                            data: obfuscateItem(deobfuscateItem(item.data)),
                        };
                    }
                }
            }

            return { state, snapshot };
        }
    }
};

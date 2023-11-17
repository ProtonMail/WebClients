import { deobfuscateItem, obfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemsByShareId } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { Maybe, PassCryptoSnapshot, SerializedCryptoContext } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { logger } from '@proton/pass/utils/logger';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { getCacheEncryptionKey } from './cache.encrypt';
import { decryptData } from './crypto-helpers';

const decrypt = async <T extends object>(options: {
    data: string;
    key: CryptoKey;
    useTextDecoder: boolean;
}): Promise<T | undefined> => {
    if (!options.data) return;

    try {
        const encryptedData = stringToUint8Array(options.data);
        const decryptedData = await decryptData(options.key, encryptedData, PassEncryptionTag.Cache);

        const decoder = new TextDecoder();
        return JSON.parse(
            options.useTextDecoder ? decoder.decode(decryptedData) : uint8ArrayToString(decryptedData)
        ) as T;
    } catch (error) {
        logger.warn(`[Cache::decrypt] Decryption failure`, error);
    }
};

export const decryptCachedState = async (
    { state: encryptedState, snapshot: encryptedSnapshot, salt }: Partial<EncryptedPassCache>,
    sessionLockToken: Maybe<string>
): Promise<Maybe<PassCache>> => {
    if (!encryptedState) logger.warn(`[Cache::decrypt] Cached state not found`);
    if (!encryptedSnapshot) logger.warn(`[Cache::decrypt] Crypto snapshot not found`);
    if (!salt) logger.warn(`[Cache::decrypt] Salt not found`);

    if (encryptedState && encryptedSnapshot && salt) {
        logger.info(`[Cache::decrypt] Decrypting cache [sessionLockToken=${!!sessionLockToken}]`);
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

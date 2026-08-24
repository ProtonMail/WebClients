import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { unwrapOptimisticState } from '../../store/optimistic/utils/transformers';
import type { ItemsByShareId } from '../../store/reducers';
import type { State } from '../../store/types';
import type { Maybe, PassCryptoSnapshot, SerializedCryptoContext } from '../../types';
import { PassEncryptionTag } from '../../types';
import type { EncryptedPassCache, PassCache } from '../../types/worker/cache';
import { logger } from '../../utils/logger';
import { objectFilter } from '../../utils/object/filter';
import { deserialize } from '../../utils/object/serialize';
import { decryptData } from '../crypto/utils/crypto-helpers';
import { PassCryptoError } from '../crypto/utils/errors';
import { deobfuscateItem, obfuscateItem } from '../items/item.obfuscation';

const decrypt = async <T extends object>(options: {
    data: string;
    key: CryptoKey;
    useTextDecoder: boolean;
}): Promise<T | undefined> => {
    if (!options.data) return;

    try {
        const encryptedData = binaryStringToUint8Array(options.data);
        const decryptedData = await decryptData(options.key, encryptedData, PassEncryptionTag.Cache);

        const decoder = new TextDecoder();
        const value = options.useTextDecoder ? decoder.decode(decryptedData) : uint8ArrayToBinaryString(decryptedData);
        return deserialize<T>(value);
    } catch (error) {
        logger.warn(`[Cache::decrypt] Decryption failure`, error);
    }
};

/** Ensures synchronization between the `PassCache` state and its snapshot by removing
 * shares from the state that lack a corresponding share manager reference in the snapshot.
 * If removal creates a discrepancy in the item shares, returns undefined to indicate that
 * a refetch is necessary to reconcile the state and snapshot. */
export const sanitizeCache = (cache: Maybe<PassCache>): Maybe<PassCache> => {
    if (!cache) return;

    const state = { ...cache.state };

    /* Filter out shares that have no corresponding share manager reference */
    const shareManagers = Object.fromEntries(cache.snapshot.shareManagers);
    state.shares = objectFilter(state.shares, (shareId) => shareId in shareManagers);

    /* Check that all item shareIDs have a corresponding share in the sanitized list */
    const itemShareIds = Object.keys(unwrapOptimisticState(state.items.byShareId));
    const valid = itemShareIds.every((shareId) => shareId in state.shares);

    return valid ? { state, snapshot: cache.snapshot } : undefined;
};

export const decryptCache = async (
    cacheKey: CryptoKey,
    { state: encryptedState, snapshot: encryptedSnapshot, salt }: Partial<EncryptedPassCache>
): Promise<Maybe<PassCache>> => {
    if (!encryptedState) logger.warn(`[Cache::decrypt] Cached state not found`);
    if (!encryptedSnapshot) logger.warn(`[Cache::decrypt] Crypto snapshot not found`);
    if (!salt) logger.warn(`[Cache::decrypt] Salt not found`);

    if (encryptedState && encryptedSnapshot && salt) {
        logger.info(`[Cache] Decrypting cache`);

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

            return sanitizeCache({ state, snapshot });
        } else throw new PassCryptoError('Cache decryption failure');
    }
};

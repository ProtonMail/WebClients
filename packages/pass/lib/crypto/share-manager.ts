import { PassCrypto } from '@proton/pass/lib/crypto';
import {
    hydrateShare,
    hydrateShareKeys,
    serializeShare,
    serializeShareKeys,
} from '@proton/pass/lib/crypto/utils/seralize';
import type {
    Maybe,
    SerializedCryptoContext,
    ShareContext,
    ShareKey,
    ShareManager,
    TypedOpenedShare,
} from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

import { PassCryptoItemError, PassCryptoShareError, PassCryptoVaultError } from './utils/errors';

export const createShareManager = <T extends ShareType = ShareType>(
    share: TypedOpenedShare<T>,
    context?: ShareContext
): ShareManager<T> => {
    const ctx: ShareContext = context ?? {
        share,
        latestRotation: -1,
        vaultKeys: new Map(),
        itemKeys: new Map(),
    };

    const manager: ShareManager<T> = {
        getShare: () => ctx.share as TypedOpenedShare<T>,
        setShare: (share) => (ctx.share = share),
        getType: () => ctx.share.targetType,
        isGroupShare: () => !!ctx.share.groupId,

        setLatestRotation: (rotation) => (ctx.latestRotation = rotation),

        getLatestRotation() {
            if (ctx.latestRotation === -1) throw new PassCryptoShareError(`Share has not been hydrated`);
            return ctx.latestRotation;
        },

        hasVaultShareKey: (rotation) => manager.getType() === ShareType.Vault && ctx.vaultKeys.has(rotation),

        getVaultShareKey(rotation) {
            if (manager.getType() !== ShareType.Vault) {
                throw new PassCryptoVaultError(`Cannot resolve vault keys for non-vault share`);
            }

            if (!manager.hasVaultShareKey(rotation)) {
                throw new PassCryptoVaultError(`Cannot find vault key for rotation ${rotation}`);
            }

            return ctx.vaultKeys.get(rotation)!;
        },

        getVaultShareKeys: () => Array.from(ctx.vaultKeys.values()),

        addVaultShareKey(vaultShareKey) {
            if (manager.getType() !== ShareType.Vault) {
                throw new PassCryptoVaultError(`Cannot add vault key to non-vault share`);
            }

            const rotation = vaultShareKey.rotation;
            ctx.vaultKeys.set(rotation, vaultShareKey);
            if (rotation > ctx.latestRotation) manager.setLatestRotation(rotation);
        },

        hasItemShareKey: (rotation) => manager.getShare().targetType === ShareType.Item && ctx.itemKeys.has(rotation),

        getItemShareKey: (rotation) => {
            if (manager.getShare().targetType !== ShareType.Item) {
                throw new PassCryptoVaultError(`Cannot resolve item keys for non-item share`);
            }

            if (!manager.hasItemShareKey(rotation)) {
                throw new PassCryptoItemError(`Cannot find item key for rotation ${rotation}`);
            }

            return ctx.itemKeys.get(rotation)!;
        },

        getItemShareKeys: () => Array.from(ctx.itemKeys.values()),

        addItemShareKey(itemShareKey) {
            if (manager.getShare().targetType !== ShareType.Item) {
                throw new PassCryptoVaultError(`Cannot add item key to non-item share`);
            }

            const rotation = itemShareKey.rotation;
            ctx.itemKeys.set(rotation, itemShareKey);
            if (rotation > ctx.latestRotation) manager.setLatestRotation(rotation);
        },

        /* A share is considered `active` if its latest rotation key was
         * encrypted with an active user key - if the user key is inactive,
         * then share should be ignored until it becomes "active" again */
        isActive(): boolean {
            try {
                const rotation = manager.getLatestRotation();
                const targetKey = ((): Maybe<ShareKey> => {
                    switch (manager.getType()) {
                        case ShareType.Vault:
                            return manager.getVaultShareKey(rotation);
                        case ShareType.Item:
                            return manager.getItemShareKey(rotation);
                    }
                })();
                if (!targetKey) return false;

                if (manager.isGroupShare()) {
                    const { addresses, groupKeys: groupKeysContext } = PassCrypto.getContext();
                    const { addressId, groupId } = manager.getShare();
                    const addressKeys = addresses?.find((address) => address.ID === addressId)?.Keys;
                    const groupKeys = groupKeysContext.get(groupId as string);
                    return !!(addressKeys?.length && groupKeys?.length);
                }

                const { userKeys } = PassCrypto.getContext();
                return userKeys?.some(({ ID }) => ID === targetKey.userKeyId) || false;
            } catch (_) {
                return false;
            }
        },

        serialize: () => ({
            ...ctx,
            share: serializeShare(ctx.share),
            vaultKeys: serializeShareKeys(ctx.vaultKeys),
            itemKeys: serializeShareKeys(ctx.itemKeys),
        }),
    };

    return manager as ShareManager<T>;
};

createShareManager.fromSnapshot = async (snapshot: SerializedCryptoContext<ShareContext>): Promise<ShareManager> => {
    const share = hydrateShare(snapshot.share);

    return createShareManager(share, {
        ...snapshot,
        share,
        vaultKeys: await hydrateShareKeys(snapshot.vaultKeys),
        itemKeys: await hydrateShareKeys(snapshot.itemKeys),
    });
};

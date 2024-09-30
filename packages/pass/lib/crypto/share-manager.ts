import type {
    OpenedShare,
    Rotation,
    SerializedCryptoContext,
    ShareContext,
    ShareManager,
    TypedOpenedShare,
    VaultKey,
} from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { importSymmetricKey } from './utils/crypto-helpers';
import { PassCryptoShareError, PassCryptoVaultError } from './utils/errors';

export const createShareManager = <T extends ShareType = ShareType>(
    share: TypedOpenedShare<T>,
    context?: ShareContext
): ShareManager<T> => {
    const shareContext: ShareContext = context ?? {
        share,
        latestRotation: -1,
        vaultKeys: new Map(),
        itemKeys: new Map(),
    };

    const shareManager: ShareManager<T> = {
        getShare: () => shareContext.share as TypedOpenedShare<T>,
        setShare: (share) => (shareContext.share = share),

        setLatestRotation: (rotation) => (shareContext.latestRotation = rotation),

        getLatestRotation() {
            if (shareContext.latestRotation === -1) {
                throw new PassCryptoShareError(`Share has not been hydrated`);
            }

            return shareContext.latestRotation;
        },

        hasVaultKey: (rotation) =>
            shareManager.getShare().targetType === ShareType.Vault && shareContext.vaultKeys.has(rotation),

        getVaultKey(rotation) {
            if (shareManager.getShare().targetType !== ShareType.Vault) {
                throw new PassCryptoVaultError(`Cannot resolve vault keys for non-vault share`);
            }

            if (!shareManager.hasVaultKey(rotation)) {
                throw new PassCryptoVaultError(`Cannot find vault key for rotation ${rotation}`);
            }

            return shareContext.vaultKeys.get(rotation)!;
        },

        getVaultKeys: () => Array.from(shareContext.vaultKeys.values()),

        addVaultKey(vaultKey) {
            if (shareManager.getShare().targetType !== ShareType.Vault) {
                throw new PassCryptoVaultError(`Cannot add vault key to non-vault share`);
            }

            const rotation = vaultKey.rotation;
            shareContext.vaultKeys.set(rotation, vaultKey);

            if (rotation > shareContext.latestRotation) {
                shareManager.setLatestRotation(rotation);
            }
        },

        /* a share is considered `active` if its latest rotation key
         * was encrypted with an active user key - if the user key is
         * inactive, then share should be ignored until it becomes
         * active again */
        isActive(userKeys = []) {
            try {
                const { targetType } = shareManager.getShare();
                const latestRotation = shareManager.getLatestRotation();

                if (targetType === ShareType.Vault) {
                    const vaultKey = shareManager.getVaultKey(latestRotation);
                    return userKeys.some(({ ID }) => ID === vaultKey.userKeyId);
                }

                return false;
            } catch (_) {
                return false;
            }
        },

        serialize: () => ({
            ...shareContext,
            share: (() => {
                switch (shareContext.share.targetType) {
                    case ShareType.Vault: {
                        return {
                            ...shareContext.share,
                            content: uint8ArrayToBase64String(shareContext.share.content),
                        };
                    }
                    case ShareType.Item:
                        return shareContext.share;
                }
            })(),
            vaultKeys: [...shareContext.vaultKeys.entries()].map(([rotation, vaultKey]) => [
                rotation,
                {
                    rotation: vaultKey.rotation,
                    raw: uint8ArrayToBase64String(vaultKey.raw),
                    userKeyId: vaultKey.userKeyId,
                },
            ]),
            itemKeys: [],
        }),
    };

    return shareManager as ShareManager<T>;
};

createShareManager.fromSnapshot = async (snapshot: SerializedCryptoContext<ShareContext>): Promise<ShareManager> => {
    /**
     * Item shares do not have a content property
     * Only encode the vault content when dealing
     * with VaultShares
     */
    const share: OpenedShare = (() => {
        switch (snapshot.share.targetType) {
            case ShareType.Vault: {
                return { ...snapshot.share, content: base64StringToUint8Array(snapshot.share.content) };
            }
            case ShareType.Item: {
                return snapshot.share;
            }
        }
    })();

    const vaultKeys: [Rotation, VaultKey][] = await Promise.all(
        snapshot.vaultKeys.map(async ([rotation, vaultKey]) => {
            const rawKey = base64StringToUint8Array(vaultKey.raw);
            return [
                rotation,
                {
                    rotation: vaultKey.rotation,
                    raw: rawKey,
                    key: await importSymmetricKey(rawKey),
                    userKeyId: vaultKey.userKeyId,
                },
            ];
        })
    );

    return createShareManager(share, {
        ...snapshot,
        share,
        vaultKeys: new Map(vaultKeys),
        itemKeys: new Map(),
    });
};

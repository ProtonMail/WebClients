import * as Comlink from 'comlink';

import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import type { PassCryptoManagerContext, PassCryptoWorker, ShareManager } from '../types';
import { ShareType } from '../types';
import { logger } from '../utils/logger';
import * as processes from './processes';
import { createShareManager } from './share-manager';
import { getSupportedAddresses } from './utils/addresses';
import {
    PassCryptoError,
    PassCryptoHydrationError,
    PassCryptoNotHydratedError,
    PassCryptoShareError,
    isPassCryptoError,
} from './utils/errors';

function assertHydrated(ctx: PassCryptoManagerContext): asserts ctx is Required<PassCryptoManagerContext> {
    if (
        ctx.user === undefined ||
        ctx.addresses === undefined ||
        ctx.primaryAddress === undefined ||
        ctx.userKeys === undefined ||
        ctx.primaryUserKey === undefined
    ) {
        throw new PassCryptoNotHydratedError('Pass crypto manager incorrectly hydrated');
    }
}

const createPassCrypto = (): PassCryptoWorker => {
    const context: PassCryptoManagerContext = {
        user: undefined,
        userKeys: [],
        addresses: [],
        primaryUserKey: undefined,
        primaryAddress: undefined,
        shareManagers: new Map(),
    };

    const hasShareManager = (shareId: string): boolean => context.shareManagers.has(shareId);
    const getShareManager = (shareId: string): ShareManager => {
        if (!hasShareManager(shareId)) {
            throw new PassCryptoShareError(`Unknown shareId : cannot resolve share manager`);
        }
        return context.shareManagers.get(shareId)!;
    };

    const worker: PassCryptoWorker = {
        async hydrate({ user, addresses, keyPassword, snapshot }) {
            logger.info('[PassCrypto::Worker] Hydrating...');

            try {
                const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
                const activeAddresses = addresses.filter(getSupportedAddresses);

                if (userKeys.length === 0) throw new PassCryptoHydrationError('No user keys found');
                if (activeAddresses.length === 0) throw new PassCryptoHydrationError('No active user addresses found');

                context.user = user;
                context.addresses = addresses;
                context.primaryAddress = activeAddresses[0];
                context.userKeys = userKeys;
                context.primaryUserKey = userKeys[0];

                if (snapshot) {
                    context.shareManagers = new Map(
                        await Promise.all(
                            Object.values(snapshot.shareManagers).map(
                                async ([shareId, shareSnapshot]) =>
                                    [shareId, await createShareManager.fromSnapshot(shareSnapshot)] as const
                            )
                        )
                    );

                    logger.info('[PassCrypto::Worker] Hydrated from snapshot');
                }
            } catch (e) {
                logger.warn('[PassCrypto::Worker] hydration failed', e);
                throw new PassCryptoHydrationError('Hydration failure');
            }
        },

        clear() {
            context.user = undefined;
            context.userKeys = [];
            context.addresses = [];
            context.primaryAddress = undefined;
            context.primaryUserKey = undefined;
            context.shareManagers = new Map();
        },

        getShareManager,

        /**
         * Creating a vault does not register a share manager :
         * call PassCrypto::openShare to register it
         */
        async createVault(content) {
            assertHydrated(context);

            return processes.createVault({
                content,
                userKey: context.primaryUserKey,
                addressId: context.primaryAddress.ID,
            });
        },

        /**
         * Updating a vault does not register a share manager :
         * call PassCrypto::openShare to register it.
         *
         * ⚠️ Key rotation : We're assuming the shareManager will
         * always hold the latest rotation keys - In order to future
         * -proof this, each vault update should be preceded by a
         * call to retrieve the latest shareKeys.
         */
        async updateVault({ shareId, content }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const latestRotation = shareManager.getLatestRotation();
            const vaultKey = shareManager.getVaultKey(latestRotation);

            return processes.updateVault({ vaultKey, content });
        },

        /**
         * Opening a new share has the side-effect of registering a
         * shareManager for this share. When opening a pre-registered
         * share (most likely hydrated from a snapshot) - filter the
         * vault keys to only open those we haven't already processed.
         * This can happen during a vault  share content update or during
         * a full data sync.
         */
        async openShare({ encryptedShare, shareKeys }) {
            assertHydrated(context);

            try {
                const shareId = encryptedShare.ShareID;
                const maybeShareManager = hasShareManager(shareId) ? getShareManager(shareId) : undefined;

                const vaultKeys = await Promise.all(
                    shareKeys.map((shareKey) =>
                        maybeShareManager?.hasVaultKey(shareKey.KeyRotation)
                            ? maybeShareManager.getVaultKey(shareKey.KeyRotation)
                            : processes.openVaultKey({ shareKey, userKeys: context.userKeys })
                    )
                );

                const share = await (() => {
                    switch (encryptedShare.TargetType) {
                        case ShareType.Vault: {
                            const rotation = encryptedShare.ContentKeyRotation!;
                            const vaultKey = vaultKeys.find((key) => key.rotation === rotation);

                            if (vaultKey === undefined) {
                                throw new PassCryptoShareError(`Missing vault key for rotation ${rotation}`);
                            }

                            return processes.openShare({ type: ShareType.Vault, encryptedShare, vaultKey });
                        }

                        case ShareType.Item:
                            return processes.openShare({ type: ShareType.Item, encryptedShare });

                        default:
                            throw new PassCryptoShareError('Unsupported share type');
                    }
                })();

                const shareManager = maybeShareManager ?? createShareManager(share);
                context.shareManagers.set(shareId, shareManager);

                shareManager.setShare(share); /* handle update when recyling */
                await worker.updateShareKeys({ shareId, shareKeys });

                return shareManager.getShare();
            } catch (err: any) {
                throw isPassCryptoError(err) ? err : new PassCryptoError(err);
            }
        },

        /**
         * TODO: add support for itemKeys when we
         * support ItemShares
         */
        async updateShareKeys({ shareId, shareKeys }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const newVaultKeys = await Promise.all(
                shareKeys
                    .filter(({ KeyRotation }) => !shareManager.hasVaultKey(KeyRotation))
                    .map((shareKey) => processes.openVaultKey({ shareKey, userKeys: context.userKeys }))
            );

            newVaultKeys.forEach((vaultKey) => shareManager.addVaultKey(vaultKey));
        },

        removeShare: (shareId) => context.shareManagers.delete(shareId),

        /**
         * Resolve the latest rotation for this share
         * and use the vault key for that rotation
         */
        async createItem({ shareId, content }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const latestRotation = shareManager.getLatestRotation();
            const vaultKey = shareManager.getVaultKey(latestRotation);

            return processes.createItem({ content, vaultKey });
        },

        async openItem({ shareId, encryptedItem }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const vaultKey = shareManager.getVaultKey(encryptedItem.KeyRotation!);

            return processes.openItem({ encryptedItem, vaultKey });
        },

        /**
         * We're assuming that every call to PassCrypto::updateItem will
         * be preceded by a request to resolve the latest encrypted item
         * key for future-proofing.
         */
        async updateItem({ shareId, content, latestItemKey, lastRevision }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const vaultKey = shareManager.getVaultKey(latestItemKey.KeyRotation);
            const itemKey = await processes.openItemKey({ encryptedItemKey: latestItemKey, vaultKey });

            return processes.updateItem({ itemKey, content, lastRevision });
        },

        async moveItem({ destinationShareId, content }) {
            assertHydrated(context);

            const shareManager = getShareManager(destinationShareId);
            const latestRotation = shareManager.getLatestRotation();
            const destinationVaultKey = shareManager.getVaultKey(latestRotation);

            return processes.moveItem({ destinationShareId, destinationVaultKey, content });
        },

        serialize: () => ({
            shareManagers: [...context.shareManagers.entries()].map(([shareId, shareManager]) => [
                shareId,
                shareManager.serialize(),
            ]),
        }),
    };

    return worker;
};

export const PassCrypto = createPassCrypto();
Comlink.expose(PassCrypto);

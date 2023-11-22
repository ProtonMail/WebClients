import { CryptoProxy } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';
import { authentication } from '@proton/pass/lib/auth/store';
import type {
    PassCryptoManagerContext,
    PassCryptoWorker,
    SerializedCryptoContext,
    ShareContext,
    ShareGetResponse,
    ShareKeyResponse,
    ShareManager,
    TypedOpenedShare,
} from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';
import { unwrap } from '@proton/pass/utils/fp/promises';
import { logId, logger } from '@proton/pass/utils/logger';
import { entriesMap } from '@proton/pass/utils/object/map';
import { getDecryptedAddressKeysHelper, getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

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
    if (process.env.NODE_ENV !== 'test') {
        CryptoApi.init();
        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
    }

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
        if (!hasShareManager(shareId)) throw new PassCryptoShareError(`Unknown shareId : cannot resolve share manager`);
        return context.shareManagers.get(shareId)!;
    };

    const unregisterInactiveShares = () => {
        context.shareManagers.forEach((shareManager, shareId) => {
            if (!shareManager.isActive(context.userKeys)) {
                logger.debug(`[PassCrypto::Worker] Unregistering share ${logId(shareId)} (inactive)`);
                context.shareManagers.delete(shareId);
            }
        });
    };

    /* Resolves the decrypted address key reference */
    const getPrimaryAddressKeyById = async (addressId: string) => {
        assertHydrated(context);

        const address = context.addresses.find((address) => address.ID === addressId);
        if (address === undefined) throw new PassCryptoError(`Could not find address with ID ${logId(addressId)}`);

        const [primaryAddressKey] = await getDecryptedAddressKeysHelper(
            address.Keys,
            context.user,
            context.userKeys,
            authentication.getPassword()
        );

        return primaryAddressKey;
    };

    const worker: PassCryptoWorker = {
        getContext: () => context,

        async hydrate({ user, addresses, keyPassword, snapshot }) {
            logger.debug('[PassCrypto::Worker] Hydrating...');

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
                    const entries = snapshot.shareManagers as [string, SerializedCryptoContext<ShareContext>][];
                    const shareManagers = await unwrap(entriesMap(entries)(createShareManager.fromSnapshot));
                    context.shareManagers = new Map(shareManagers);
                    logger.debug('[PassCrypto::Worker] Hydrated from snapshot');
                }
            } catch (e) {
                logger.warn('[PassCrypto::Worker] hydration failed', e);
                throw new PassCryptoHydrationError('Hydration failure');
            }

            unregisterInactiveShares();
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

        /* Creating a vault does not register a share manager :
         * call PassCrypto::openShare to register it */
        async createVault(content) {
            assertHydrated(context);

            return processes.createVault({
                content,
                userKey: context.primaryUserKey,
                addressId: context.primaryAddress.ID,
            });
        },

        /* Updating a vault does not register a share manager :
         * call PassCrypto::openShare to register it.
         *
         * ⚠️ Key rotation : We're assuming the shareManager will
         * always hold the latest rotation keys - In order to future
         * -proof this, each vault update should be preceded by a
         * call to retrieve the latest shareKeys */
        async updateVault({ shareId, content }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const latestRotation = shareManager.getLatestRotation();
            const vaultKey = shareManager.getVaultKey(latestRotation);

            return processes.updateVault({ vaultKey, content });
        },

        canOpenShare(shareId) {
            try {
                return worker.getShareManager(shareId).isActive(context.userKeys);
            } catch (_) {
                return false;
            }
        },

        /* Opening a new share has the side-effect of registering a
         * shareManager for this share. When opening a pre-registered
         * share (most likely hydrated from a snapshot) - filter the
         * vault keys to only open those we haven't already processed.
         * This can happen during a vault  share content update or during
         * a full data sync. */
        openShare: async <T extends ShareType = ShareType>(data: {
            encryptedShare: ShareGetResponse;
            shareKeys: ShareKeyResponse[];
        }) => {
            assertHydrated(context);

            try {
                const { encryptedShare, shareKeys } = data;

                if (shareKeys.length === 0) throw new PassCryptoShareError('Empty share keys');

                /* before processing the current encryptedShare - ensure the
                 * latest rotation key can be decrypted with an active userKey */
                const latestKey = shareKeys.reduce((acc, curr) => (curr.KeyRotation > acc.KeyRotation ? curr : acc));
                const canOpenShare = context.userKeys.some(({ ID }) => ID === latestKey.UserKeyID);

                if (!canOpenShare) return null;

                const shareId = encryptedShare.ShareID;
                const maybeShareManager = hasShareManager(shareId) ? getShareManager(shareId) : undefined;

                const share = await (async () => {
                    switch (encryptedShare.TargetType) {
                        case ShareType.Vault: {
                            const vaultKeys = await Promise.all(
                                shareKeys.map((shareKey) =>
                                    maybeShareManager?.hasVaultKey(shareKey.KeyRotation)
                                        ? maybeShareManager.getVaultKey(shareKey.KeyRotation)
                                        : processes.openVaultKey({ shareKey, userKeys: context.userKeys })
                                )
                            );

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

                return shareManager.getShare() as TypedOpenedShare<T>;
            } catch (err: any) {
                throw isPassCryptoError(err) ? err : new PassCryptoError(err);
            }
        },

        /* FIXME: add support for itemKeys when we
         * support ItemShares */
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

        /* Resolve the latest rotation for this share
         * and use the vault key for that rotation */
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

        /* We're assuming that every call to PassCrypto::updateItem will
         * be preceded by a request to resolve the latest encrypted item
         * key for future-proofing */
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

        async createVaultInvite({ shareId, invitedPublicKey, email, role }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const share = shareManager.getShare();
            const inviteKeys = await processes.createInviteKeys({
                targetKeys: shareManager.getVaultKeys(),
                invitedPublicKey: await CryptoProxy.importPublicKey({ armoredKey: invitedPublicKey }),
                inviterPrivateKey: (await getPrimaryAddressKeyById(share.addressId)).privateKey,
            });

            return { Keys: inviteKeys, Email: email, ShareRoleID: role, TargetType: ShareType.Vault };
        },

        async createNewUserVaultInvite({ shareId, email, role }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const share = shareManager.getShare();

            const signature = await processes.createNewUserSignature({
                inviterPrivateKey: (await getPrimaryAddressKeyById(share.addressId)).privateKey,
                invitedEmail: email,
                vaultKey: shareManager.getVaultKey(shareManager.getLatestRotation()),
            });

            return {
                Email: email,
                ShareRoleID: role,
                Signature: signature,
                TargetType: ShareType.Vault,
            };
        },

        async promoteInvite({ shareId, invitedPublicKey }) {
            assertHydrated(context);

            const shareManager = getShareManager(shareId);
            const share = shareManager.getShare();
            const inviteKeys = await processes.createInviteKeys({
                targetKeys: shareManager.getVaultKeys(),
                invitedPublicKey: await CryptoProxy.importPublicKey({ armoredKey: invitedPublicKey }),
                inviterPrivateKey: (await getPrimaryAddressKeyById(share.addressId)).privateKey,
            });

            return { Keys: inviteKeys };
        },

        async acceptVaultInvite({ inviteKeys, invitedAddressId, inviterPublicKeys }) {
            assertHydrated(context);

            const vaultKeys = await processes.reencryptInviteKeys({
                userKey: context.primaryUserKey,
                inviteKeys,
                invitedPrivateKey: (await getPrimaryAddressKeyById(invitedAddressId)).privateKey,
                inviterPublicKeys: await Promise.all(
                    inviterPublicKeys.map((armoredKey) => CryptoProxy.importPublicKey({ armoredKey }))
                ),
            });

            return { Keys: vaultKeys };
        },

        async readVaultInvite({ inviteKey, invitedAddressId, encryptedVaultContent, inviterPublicKeys }) {
            assertHydrated(context);

            return processes.readVaultInviteContent({
                inviteKey,
                encryptedVaultContent,
                invitedPrivateKey: (await getPrimaryAddressKeyById(invitedAddressId)).privateKey,
                inviterPublicKeys: await Promise.all(
                    inviterPublicKeys.map((armoredKey) => CryptoProxy.importPublicKey({ armoredKey }))
                ),
            });
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

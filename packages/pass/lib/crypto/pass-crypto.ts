import { CryptoProxy } from '@proton/crypto';
import { FILE_PUBLIC_SHARE } from '@proton/pass/constants';
import { authStore } from '@proton/pass/lib/auth/store';
import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { serializeShareManagers } from '@proton/pass/lib/crypto/utils/seralize';
import type {
    FileID,
    PassCryptoManagerContext,
    PassCryptoWorker,
    SerializedCryptoContext,
    ShareContext,
    ShareGetResponse,
    ShareKeyResponse,
    ShareManager,
    TypedOpenedShare,
} from '@proton/pass/types';
import { PassEncryptionTag, ShareType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { unwrap } from '@proton/pass/utils/fp/promises';
import { logId, logger } from '@proton/pass/utils/logger';
import { entriesMap } from '@proton/pass/utils/object/map';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKeysHelper, getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import * as processes from './processes';
import { createShareManager } from './share-manager';
import { getSupportedAddresses } from './utils/addresses';
import {
    PassCryptoError,
    PassCryptoFileError,
    PassCryptoHydrationError,
    PassCryptoNotHydratedError,
    PassCryptoShareError,
    isPassCryptoError,
} from './utils/errors';
import { resolveItemKey } from './utils/helpers';

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

export const intoFileUniqueID = (shareId: string, fileID: FileID) => `${shareId}::${fileID}`;

export const createPassCrypto = (): PassCryptoWorker => {
    const context: PassCryptoManagerContext = {
        user: undefined,
        userKeys: [],
        addresses: [],
        primaryUserKey: undefined,
        primaryAddress: undefined,
        shareManagers: new Map(),
        fileKeys: new Map(),
    };

    const hasShareManager = (shareId: string): boolean => context.shareManagers.has(shareId);

    const getShareManager = (shareId: string): ShareManager => {
        if (!hasShareManager(shareId)) throw new PassCryptoShareError(`Unknown shareId : cannot resolve share manager`);
        return context.shareManagers.get(shareId)!;
    };

    const unregisterInactiveShares = () => {
        context.shareManagers.forEach((shareManager, shareId) => {
            if (!shareManager.isActive(context.userKeys)) {
                logger.info(`[PassCrypto] Unregistering share ${logId(shareId)} (inactive)`);
                context.shareManagers.delete(shareId);
            }
        });
    };

    const getDecryptedAddressKeys = async (addressId: string): Promise<DecryptedAddressKey[]> => {
        assertHydrated(context);

        const address = context.addresses.find((address) => address.ID === addressId);
        if (address === undefined) throw new PassCryptoError(`Could not find address with ID ${logId(addressId)}`);
        return getDecryptedAddressKeysHelper(address.Keys, context.user, context.userKeys, authStore.getPassword()!);
    };

    /** Resolves the decrypted address key reference */
    const getPrimaryAddressKeyById = async (addressId: string): Promise<DecryptedAddressKey> => {
        const primaryAddressKey = first(await getDecryptedAddressKeys(addressId));
        if (!primaryAddressKey) throw new PassCryptoError(`No primary address key`);

        return primaryAddressKey;
    };

    const worker: PassCryptoWorker = {
        get ready() {
            try {
                assertHydrated(context);
                return true;
            } catch {
                return false;
            }
        },

        getContext: () => context,

        async hydrate({ user, addresses, keyPassword, snapshot, clear }) {
            logger.info('[PassCrypto] Hydrating crypto state');

            if (clear) worker.clear();

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
                    logger.info('[PassCrypto] Hydrated from local snapshot');
                }
            } catch (err) {
                logger.warn('[PassCrypto] Hydration failed', err);
                const message = err instanceof Error ? err.message : 'unknown error';
                throw new PassCryptoHydrationError(`Hydration failure (${message})`);
            }

            unregisterInactiveShares();
        },

        clear() {
            logger.info('[PassCrypto] Clearing state');
            context.user = undefined;
            context.userKeys = [];
            context.addresses = [];
            context.primaryAddress = undefined;
            context.primaryUserKey = undefined;
            context.shareManagers = new Map();
            context.fileKeys = new Map();
        },

        getShareManager,

        getDecryptedAddressKeys,

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

            const manager = getShareManager(shareId);
            const latestRotation = manager.getLatestRotation();
            const vaultKey = manager.getVaultShareKey(latestRotation);

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
                                    maybeShareManager?.hasVaultShareKey(shareKey.KeyRotation)
                                        ? maybeShareManager.getVaultShareKey(shareKey.KeyRotation)
                                        : processes.openShareKey({ shareKey, userKeys: context.userKeys })
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

                const manager = maybeShareManager ?? createShareManager(share);

                context.shareManagers.set(shareId, manager);
                manager.setShare(share); /* handle update when recyling */
                await worker.updateShareKeys({ shareId, shareKeys });

                return manager.getShare() as TypedOpenedShare<T>;
            } catch (err: any) {
                throw isPassCryptoError(err) ? err : new PassCryptoError(err);
            }
        },

        async updateShareKeys({ shareId, shareKeys }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const { userKeys } = context;

            switch (manager.getType()) {
                case ShareType.Vault: {
                    const keys = shareKeys.filter(({ KeyRotation }) => !manager.hasVaultShareKey(KeyRotation));
                    const newKeys = keys.map((shareKey) => processes.openShareKey({ shareKey, userKeys }));
                    return (await Promise.all(newKeys)).forEach(manager.addVaultShareKey);
                }

                case ShareType.Item: {
                    const keys = shareKeys.filter(({ KeyRotation }) => !manager.hasItemShareKey(KeyRotation));
                    const newKeys = keys.map((shareKey) => processes.openShareKey({ shareKey, userKeys }));
                    return (await Promise.all(newKeys)).forEach(manager.addItemShareKey);
                }
            }
        },

        removeShare: (shareId) => context.shareManagers.delete(shareId),

        /* Resolve the latest rotation for this share
         * and use the vault key for that rotation */
        async createItem({ shareId, content }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const latestRotation = manager.getLatestRotation();
            const vaultKey = manager.getVaultShareKey(latestRotation);

            return processes.createItem({ content, vaultKey });
        },

        async openItem({ shareId, encryptedItem }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const share = manager.getShare();

            const itemKey = await (async () => {
                switch (share.targetType) {
                    case ShareType.Vault: {
                        const shareKey = manager.getVaultShareKey(encryptedItem.KeyRotation!);
                        return processes.openItemKey({
                            shareKey,
                            encryptedItemKey: {
                                Key: encryptedItem.ItemKey!,
                                KeyRotation: encryptedItem.KeyRotation!,
                            },
                        });
                    }

                    case ShareType.Item: {
                        return manager.getItemShareKey(encryptedItem.KeyRotation);
                    }
                }
            })();

            return processes.openItem({ encryptedItem, itemKey });
        },

        /* We're assuming that every call to PassCrypto::updateItem will
         * be preceded by a request to resolve the latest encrypted item
         * key for future-proofing */
        async updateItem({ content, itemKey, lastRevision }) {
            assertHydrated(context);
            return processes.updateItem({ itemKey, content, lastRevision });
        },

        async moveItem({ targetShareId, itemId, shareId, encryptedItemKeys }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const rotation = manager.getLatestRotation();
            const shareKey = manager.getVaultShareKey(rotation);

            const itemKeys = await Promise.all(
                encryptedItemKeys.map((key) =>
                    processes.openItemKey({
                        encryptedItemKey: key,
                        shareKey,
                    })
                )
            );

            const targetManager = getShareManager(targetShareId);
            const targetRotation = targetManager.getLatestRotation();
            const targetVaultKey = targetManager.getVaultShareKey(targetRotation);

            return processes.moveItem({ itemId, itemKeys, targetVaultKey });
        },

        async createInvite({ shareId, itemId, invitedPublicKey, email, role, targetKeys }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const share = manager.getShare();
            const inviteKeys = await processes.createInviteKeys({
                targetKeys,
                invitedPublicKey: await CryptoProxy.importPublicKey({ armoredKey: invitedPublicKey }),
                inviterPrivateKey: (await getPrimaryAddressKeyById(share.addressId)).privateKey,
            });

            return {
                Keys: inviteKeys,
                Email: email,
                ShareRoleID: role,
                TargetType: !itemId ? ShareType.Vault : ShareType.Item,
                ItemID: itemId,
            };
        },

        /** New user invites does not support item sharing.
         * Passing an item share shareId will throw. */
        async createNewUserInvite({ shareId, email, role, itemId }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const share = manager.getShare();
            const sharedItem = itemId && share.targetType === ShareType.Item;
            const rotation = manager.getLatestRotation();

            const signature = await processes.createNewUserSignature({
                inviterPrivateKey: (await getPrimaryAddressKeyById(share.addressId)).privateKey,
                invitedEmail: email,
                shareKey: sharedItem ? manager.getItemShareKey(rotation) : manager.getVaultShareKey(rotation),
            });

            return {
                Email: email,
                ShareRoleID: role,
                Signature: signature,
                TargetType: !itemId ? ShareType.Vault : ShareType.Item,
                ItemID: itemId,
            };
        },

        async promoteInvite({ shareId, invitedPublicKey }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const share = manager.getShare();
            const inviteKeys = await processes.createInviteKeys({
                targetKeys: manager.getVaultShareKeys(),
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

        registerFileKey: ({ fileKey, fileID, shareId }) => {
            /** Do not assert context here, so it can be used in Secure Links */
            context.fileKeys.set(intoFileUniqueID(shareId, fileID), fileKey);
        },

        getFileKey: ({ shareId, fileID }) => {
            const fileKey = context.fileKeys.get(intoFileUniqueID(shareId, fileID));
            if (!fileKey) throw new PassCryptoFileError(`Could not resolve file key for ${fileID}`);
            return fileKey;
        },

        async encryptFileKey({ itemKey, fileID, shareId }) {
            const fileKey = worker.getFileKey({ shareId, fileID });
            return encryptData(itemKey.key, fileKey, PassEncryptionTag.FileKey);
        },

        async createFileDescriptor({ metadata, fileID, shareId, encryptionVersion }) {
            assertHydrated(context);

            const fileKey = fileID ? worker.getFileKey({ shareId, fileID }) : undefined;
            return processes.createFileDescriptor(metadata, encryptionVersion, fileKey);
        },

        async openFileDescriptor({ file, itemKey, shareId }) {
            assertHydrated(context);

            const { fileKey, metadata } = await processes.openFileDescriptor(
                file.Metadata,
                file.FileKey,
                itemKey,
                file.EncryptionVersion ?? 1
            );

            worker.registerFileKey({ fileKey, fileID: file.FileID, shareId });
            return metadata;
        },

        async createFileChunk({ chunk, chunkIndex, encryptionVersion, totalChunks, fileID, shareId }) {
            assertHydrated(context);

            if (chunk.size === 0) throw new PassCryptoFileError('File cannot be empty');

            const fileKey = worker.getFileKey({ shareId, fileID });
            return processes.createFileChunk(chunk, chunkIndex, totalChunks, fileKey, encryptionVersion);
        },

        async openFileChunk({ chunk, chunkIndex, fileID, shareId, totalChunks, encryptionVersion }) {
            /** Do not assert context here, so it can be used in Secure Links */
            if (chunk.byteLength === 0) throw new PassCryptoFileError('Encrypted chunk cannot be empty');

            const fileKey = worker.getFileKey({ shareId, fileID });
            return processes.openFileChunk(chunk, chunkIndex, totalChunks, fileKey, encryptionVersion);
        },

        async createSecureLink({ itemKey, shareId }) {
            assertHydrated(context);

            const shareKey = (() => {
                if (!shareId) return itemKey;

                const manager = getShareManager(shareId);
                const rotation = manager.getLatestRotation();

                return (() => {
                    switch (manager.getType()) {
                        case ShareType.Vault:
                            return manager.getVaultShareKey(rotation);
                        case ShareType.Item:
                            return manager.getItemShareKey(rotation);
                    }
                })();
            })();

            return processes.createSecureLink({ itemKey, shareKey });
        },

        async openSecureLink({ linkKey, publicLinkContent }) {
            if (!publicLinkContent.ItemKey || !publicLinkContent.Contents) {
                throw new Error('Missing data when retrieving secure link content');
            }

            return processes.openSecureLink({
                encryptedItemKey: publicLinkContent.ItemKey,
                content: publicLinkContent.Contents,
                linkKey,
            });
        },

        async openSecureLinkFileDescriptor({
            encryptedItemKey,
            encryptedFileKey,
            encryptedMetadata,
            encryptionVersion,
            fileID,
            linkKey,
        }) {
            const { fileKey, metadata } = await processes.openSecureLinkFileDescriptor({
                encryptedFileKey,
                encryptedItemKey,
                encryptedMetadata,
                encryptionVersion,
                linkKey,
            });

            worker.registerFileKey({ fileKey, fileID, shareId: FILE_PUBLIC_SHARE });

            return metadata;
        },

        async openLinkKey({ encryptedLinkKey, linkKeyShareKeyRotation, shareId, itemId, linkKeyEncryptedWithItemKey }) {
            assertHydrated(context);

            const shareKey: CryptoKey = await (async () => {
                if (!linkKeyEncryptedWithItemKey) {
                    const vaultKey = getShareManager(shareId).getVaultShareKey(linkKeyShareKeyRotation);
                    return vaultKey.key;
                }

                const itemKey = await resolveItemKey(shareId, itemId);
                return itemKey.key;
            })();

            return processes.openLinkKey({ encryptedLinkKey, shareKey });
        },

        async openItemKey({ encryptedItemKey, shareId }) {
            assertHydrated(context);

            const manager = getShareManager(shareId);
            const rotation = manager.getLatestRotation();

            const shareKey = (() => {
                switch (manager.getType()) {
                    case ShareType.Vault:
                        return manager.getVaultShareKey(rotation);
                    case ShareType.Item:
                        return manager.getItemShareKey(rotation);
                }
            })();

            return processes.openItemKey({ encryptedItemKey, shareKey });
        },

        serialize: () => ({ shareManagers: serializeShareManagers(context.shareManagers) }),
    };

    return worker;
};

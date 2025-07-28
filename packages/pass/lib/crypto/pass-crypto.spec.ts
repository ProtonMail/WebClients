import { CryptoProxy } from '@proton/crypto';
import type { ItemRevisionContentsResponse, ShareGetResponse, ShareKeyResponse } from '@proton/pass/types';
import { ContentFormatVersion, ItemState, PassEncryptionTag, ShareRole, ShareType } from '@proton/pass/types';
import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { Address, DecryptedKey, Key, User } from '@proton/shared/lib/interfaces';

import { PassCrypto, exposePassCrypto } from './index';
import { createPassCrypto } from './pass-crypto';
import * as processes from './processes';
import { decryptData } from './utils/crypto-helpers';
import { PassCryptoHydrationError, PassCryptoNotHydratedError, PassCryptoShareError } from './utils/errors';
import {
    TEST_KEY_PASSWORD,
    TEST_USER_KEY_ID,
    createRandomKey,
    createRandomShareResponses,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from './utils/testing';

describe('PassCrypto', () => {
    let user: User;
    let userKey: DecryptedKey;
    const address = {
        ID: `addressId-${Math.random()}`,
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_YES,
    } as Address;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        userKey = await createRandomKey();
        const PrivateKey = await CryptoProxy.exportPrivateKey({
            privateKey: userKey.privateKey,
            passphrase: TEST_KEY_PASSWORD,
        });

        user = {
            Keys: [
                {
                    ID: TEST_USER_KEY_ID,
                    PrivateKey,
                    Version: 3,
                    Active: 1,
                } as Key,
            ],
        } as User;

        exposePassCrypto(createPassCrypto());
    });

    afterAll(async () => releaseCryptoProxy());

    describe('PassCrypto::hydrate', () => {
        afterEach(() => PassCrypto.clear());

        test('should throw if no user keys', async () => {
            await expect(
                PassCrypto.hydrate({
                    user: { Keys: [] } as unknown as User,
                    addresses: [address],
                    keyPassword: TEST_KEY_PASSWORD,
                })
            ).rejects.toThrow(PassCryptoHydrationError);
        });

        test('should throw if no active address keys', async () => {
            await expect(
                PassCrypto.hydrate({
                    user,
                    addresses: [{ ...address, Status: ADDRESS_STATUS.STATUS_DISABLED }],
                    keyPassword: TEST_KEY_PASSWORD,
                })
            ).rejects.toThrow(PassCryptoHydrationError);
        });

        test('should hydrate correctly', async () => {
            await expect(
                PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD })
            ).resolves.not.toThrow();
        });

        test('should throw if no active user keys', async () => {
            const userKey = user.Keys[0];
            const inactiveKey = await createRandomKey();
            const inactiveUserKey = await CryptoProxy.exportPrivateKey({
                privateKey: inactiveKey.privateKey,
                passphrase: `${TEST_KEY_PASSWORD}-inactive`,
            });

            const userReset = {
                ...user,
                Keys: [
                    {
                        ...userKey,
                        ID: `${TEST_USER_KEY_ID}-inactive-1`,
                        Active: 0,
                        PrivateKey: inactiveUserKey,
                    },
                ],
            } as User;

            await expect(
                PassCrypto.hydrate({ user: userReset, addresses: [address], keyPassword: TEST_KEY_PASSWORD })
            ).rejects.toThrow(PassCryptoHydrationError);
        });

        test('should only track  active user keys', async () => {
            const userKey = user.Keys[0];
            const inactiveKey = await createRandomKey();
            const inactiveUserKey = await CryptoProxy.exportPrivateKey({
                privateKey: inactiveKey.privateKey,
                passphrase: `${TEST_KEY_PASSWORD}-inactive`,
            });

            const userReset = {
                ...user,
                Keys: [
                    userKey,
                    {
                        ...userKey,
                        ID: `${TEST_USER_KEY_ID}-inactive-1`,
                        Active: 0,
                        PrivateKey: inactiveUserKey,
                    },
                ],
            } as User;

            await PassCrypto.hydrate({ user: userReset, addresses: [address], keyPassword: TEST_KEY_PASSWORD });
            expect(PassCrypto.getContext().userKeys!.length).toEqual(1);
            expect(PassCrypto.getContext().userKeys?.[0].ID).toEqual(TEST_USER_KEY_ID);
        });
    });

    describe('PassCrypto::createVault', () => {
        afterEach(() => PassCrypto.clear());

        test('should throw if PassCrypto not hydrated', async () => {
            await expect(PassCrypto.createVault(randomContents())).rejects.toThrow(PassCryptoNotHydratedError);
        });

        test('should call createVault with primary user key and primary addressId', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const content = randomContents();
            const vault = await PassCrypto.createVault(content);

            expect(vault.AddressID).toEqual(address.ID);
            expect(vault.ContentFormatVersion).toEqual(ContentFormatVersion.Share);

            const vaultKey = await processes.openShareKey({
                userKeys: [userKey],
                shareKey: {
                    Key: vault.EncryptedVaultKey,
                    KeyRotation: 1,
                    CreateTime: 0,
                    UserKeyID: 'test_user_key_id',
                },
            });

            const decryptedContent = await decryptData(
                vaultKey.key,
                base64StringToUint8Array(vault.Content),
                PassEncryptionTag.VaultContent
            );

            expect(decryptedContent).toStrictEqual(content);
        });
    });

    describe('PassCrypto::updateVault', () => {
        afterEach(() => PassCrypto.clear());

        test('should throw if PassCrypto not hydrated', async () => {
            await expect(PassCrypto.updateVault({} as any)).rejects.toThrow(PassCryptoNotHydratedError);
        });

        test('should call updateVault with latest vaultKey', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const vault = await PassCrypto.createVault(randomContents());

            const shareKey: ShareKeyResponse = {
                Key: vault.EncryptedVaultKey,
                KeyRotation: 42,
                CreateTime: 0,
                UserKeyID: TEST_USER_KEY_ID,
            };

            const encryptedShare: ShareGetResponse = {
                AddressID: vault.AddressID,
                Content: vault.Content,
                ContentFormatVersion: ContentFormatVersion.Share,
                ContentKeyRotation: 42,
                CreateTime: 0,
                ExpireTime: 0,
                NewUserInvitesReady: 0,
                Owner: true,
                PendingInvites: 0,
                Permission: 1,
                Primary: false,
                Shared: false,
                ShareID: `shareId-${Math.random()}`,
                ShareRoleID: ShareRole.MANAGER,
                TargetID: `targetId-${Math.random()}`,
                TargetMaxMembers: 2,
                TargetMembers: 0,
                TargetType: ShareType.Vault,
                VaultID: `vaultId-${Math.random()}`,
                CanAutoFill: true,
                Flags: 0,
            };

            /* register the share */
            const share = await PassCrypto.openShare({ encryptedShare, shareKeys: [shareKey] });
            const contentUpdate = randomContents();
            const vaultUpdate = await PassCrypto.updateVault({ shareId: share!.shareId, content: contentUpdate });
            const vaultKey = PassCrypto.getShareManager(share!.shareId).getVaultShareKey(42);

            const decryptedContent = await decryptData(
                vaultKey.key,
                base64StringToUint8Array(vaultUpdate.Content),
                PassEncryptionTag.VaultContent
            );

            expect(decryptedContent).toStrictEqual(contentUpdate);
            expect(vaultUpdate.ContentFormatVersion).toEqual(ContentFormatVersion.Share);
            expect(vaultUpdate.KeyRotation).toEqual(42);
        });
    });

    describe('PassCrypto::openShare', () => {
        afterEach(() => PassCrypto.clear());

        test('should throw if PassCrypto not hydrated', async () => {
            await expect(PassCrypto.openShare({} as any)).rejects.toThrow(PassCryptoNotHydratedError);
        });

        test('should create a new share manager and add new vault keys on manager', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            /* create a vault */
            const content = randomContents();
            const vault = await PassCrypto.createVault(content);
            const shareKey: ShareKeyResponse = {
                Key: vault.EncryptedVaultKey,
                KeyRotation: 1,
                CreateTime: 0,
                UserKeyID: TEST_USER_KEY_ID,
            };

            /* mock response */
            const encryptedShare: ShareGetResponse = {
                AddressID: vault.AddressID,
                Content: vault.Content,
                ContentFormatVersion: ContentFormatVersion.Share,
                ContentKeyRotation: 1,
                CreateTime: 0,
                ExpireTime: 0,
                NewUserInvitesReady: 0,
                Owner: true,
                PendingInvites: 0,
                Permission: 1,
                Primary: false,
                Shared: false,
                ShareID: `shareId-${Math.random()}`,
                ShareRoleID: ShareRole.MANAGER,
                TargetID: `targetId-${Math.random()}`,
                TargetMaxMembers: 2,
                TargetMembers: 0,
                TargetType: ShareType.Vault,
                VaultID: `vaultId-${Math.random()}`,
                CanAutoFill: true,
                Flags: 0,
            };

            const share = await PassCrypto.openShare({ encryptedShare, shareKeys: [shareKey] });
            const shareManager = PassCrypto.getShareManager(encryptedShare.ShareID);

            expect(share!.content).toEqual(content);
            expect(PassCrypto.getShareManager(encryptedShare.ShareID)).toBeDefined();
            expect(shareManager.getShare()).toStrictEqual(share);
            expect(shareManager.hasVaultShareKey(1)).toBe(true);

            /* simulate new vault keys being added */
            const encryptedShareUpdate: ShareGetResponse = {
                ...encryptedShare,
                ContentKeyRotation: 2,
            };

            const newShareKey: ShareKeyResponse = {
                Key: vault.EncryptedVaultKey,
                KeyRotation: 2,
                CreateTime: 0,
                UserKeyID: TEST_USER_KEY_ID,
            };

            jest.spyOn(shareManager, 'addVaultShareKey');

            const shareUpdate = await PassCrypto.openShare({
                encryptedShare: encryptedShareUpdate,
                shareKeys: [shareKey, newShareKey],
            });

            expect(shareManager.getShare()).toStrictEqual(shareUpdate);
            expect(shareManager.hasVaultShareKey(1)).toBe(true);
            expect(shareManager.hasVaultShareKey(2)).toBe(true);
        });

        test('should throw if share keys list is empty', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const content = randomContents();
            const vault = await PassCrypto.createVault(content);

            const encryptedShare: ShareGetResponse = {
                AddressID: vault.AddressID,
                Content: vault.Content,
                ContentFormatVersion: ContentFormatVersion.Share,
                ContentKeyRotation: 2,
                CreateTime: 0,
                ExpireTime: 0,
                NewUserInvitesReady: 0,
                Owner: true,
                PendingInvites: 0,
                Permission: 1,
                Primary: false,
                Shared: false,
                ShareID: `shareId-${Math.random()}`,
                ShareRoleID: ShareRole.MANAGER,
                TargetID: `targetId-${Math.random()}`,
                TargetMaxMembers: 2,
                TargetMembers: 0,
                TargetType: ShareType.Vault,
                VaultID: `vaultId-${Math.random()}`,
                CanAutoFill: true,
                Flags: 0,
            };

            await expect(PassCrypto.openShare({ encryptedShare, shareKeys: [] })).rejects.toThrow(
                new PassCryptoShareError(`Empty share keys`)
            );
        });

        test('should throw if there are no share keys for current share rotation', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const content = randomContents();
            const vault = await PassCrypto.createVault(content);

            const shareKey: ShareKeyResponse = {
                Key: vault.EncryptedVaultKey,
                KeyRotation: 1,
                CreateTime: 0,
                UserKeyID: TEST_USER_KEY_ID,
            };

            const encryptedShare: ShareGetResponse = {
                AddressID: vault.AddressID,
                Content: vault.Content,
                ContentFormatVersion: ContentFormatVersion.Share,
                ContentKeyRotation: 2,
                CreateTime: 0,
                ExpireTime: 0,
                NewUserInvitesReady: 0,
                Owner: true,
                PendingInvites: 0,
                Permission: 1,
                Primary: false,
                Shared: false,
                ShareID: `shareId-${Math.random()}`,
                ShareRoleID: ShareRole.MANAGER,
                TargetID: `targetId-${Math.random()}`,
                TargetMaxMembers: 2,
                TargetMembers: 0,
                TargetType: ShareType.Vault,
                VaultID: `vaultId-${Math.random()}`,
                CanAutoFill: true,
                Flags: 0,
            };

            await expect(PassCrypto.openShare({ encryptedShare, shareKeys: [shareKey] })).rejects.toThrow(
                new PassCryptoShareError(`Missing vault key for rotation 2`)
            );
        });

        test('should return null if no user key can decrypt current share', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const content = randomContents();
            const vault = await PassCrypto.createVault(content);
            const shareKey: ShareKeyResponse = {
                Key: vault.EncryptedVaultKey,
                KeyRotation: 1,
                CreateTime: 0,
                UserKeyID: `${TEST_USER_KEY_ID}-inactive`,
            };

            const encryptedShare: ShareGetResponse = {
                AddressID: vault.AddressID,
                Content: vault.Content,
                ContentFormatVersion: ContentFormatVersion.Share,
                ContentKeyRotation: 1,
                CreateTime: 0,
                ExpireTime: 0,
                NewUserInvitesReady: 0,
                Owner: true,
                PendingInvites: 0,
                Permission: 1,
                Primary: false,
                Shared: false,
                ShareID: `shareId-${Math.random()}`,
                ShareRoleID: ShareRole.MANAGER,
                TargetID: `targetId-${Math.random()}`,
                TargetMaxMembers: 2,
                TargetMembers: 0,
                TargetType: ShareType.Vault,
                VaultID: `vaultId-${Math.random()}`,
                CanAutoFill: true,
                Flags: 0,
            };

            expect(await PassCrypto.openShare({ encryptedShare, shareKeys: [shareKey] })).toEqual(null);
        });
    });

    describe('PassCrypto::updateShare', () => {
        afterEach(() => PassCrypto.clear());

        test('should throw if PassCrypto not hydrated', async () => {
            await expect(PassCrypto.openShare({} as any)).rejects.toThrow(PassCryptoNotHydratedError);
        });

        test('should register only new vaults keys on shareManager', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const [encryptedShare, shareKey] = await createRandomShareResponses(userKey, address.ID);
            const shareId = encryptedShare.ShareID;
            await PassCrypto.openShare({ encryptedShare, shareKeys: [shareKey] });

            const shareManager = PassCrypto.getShareManager(encryptedShare.ShareID);

            jest.spyOn(shareManager, 'addVaultShareKey');

            const content = randomContents();
            const vault = await processes.createVault({ content, userKey, addressId: address.ID });
            const newShareKey: ShareKeyResponse = {
                Key: vault.EncryptedVaultKey,
                KeyRotation: 2,
                CreateTime: 0,
                UserKeyID: TEST_USER_KEY_ID,
            };

            await PassCrypto.updateShareKeys({ shareId, shareKeys: [shareKey] });
            expect(shareManager.addVaultShareKey).toHaveBeenCalledTimes(0);

            await PassCrypto.updateShareKeys({ shareId, shareKeys: [shareKey, newShareKey] });
            expect(shareManager.addVaultShareKey).toHaveBeenCalledTimes(1);
        });
    });

    describe('PassCrypto::openItem', () => {
        afterEach(() => PassCrypto.clear());

        test('should throw if PassCrypto not hydrated', async () => {
            await expect(PassCrypto.openItem({} as any)).rejects.toThrow(PassCryptoNotHydratedError);
        });

        test('should throw if vault share has not been registered yet', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const encryptedItem: ItemRevisionContentsResponse = {
                Content: 'base64encoded',
                ContentFormatVersion: ContentFormatVersion.Item,
                CreateTime: 0,
                Flags: 0,
                ItemID: `itemId-${Math.random()}`,
                ItemKey: 'base64encoded',
                KeyRotation: 1,
                LastUseTime: 0,
                ModifyTime: 0,
                Pinned: false,
                Revision: 1,
                RevisionTime: 0,
                ShareCount: 0,
                State: ItemState.Active,
            };

            await expect(
                PassCrypto.openItem({
                    shareId: 'somerandom',
                    encryptedItem,
                })
            ).rejects.toThrow(PassCryptoShareError);
        });

        test('should decrypt item with shareManager vault key', async () => {
            await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_KEY_PASSWORD });

            const [encryptedShare, shareKey] = await createRandomShareResponses(userKey, address.ID);
            await PassCrypto.openShare({ encryptedShare, shareKeys: [shareKey] });
            const vaultKey = await processes.openShareKey({ shareKey, userKeys: [userKey] });

            /* create item */
            const itemContent = randomContents();
            const item = await processes.createItem({ content: itemContent, vaultKey });
            const encryptedItem: ItemRevisionContentsResponse = {
                Content: item.Content,
                ContentFormatVersion: ContentFormatVersion.Item,
                CreateTime: 0,
                Flags: 0,
                ItemID: `itemId-${Math.random()}`,
                ItemKey: item.ItemKey,
                KeyRotation: 1,
                LastUseTime: 0,
                ModifyTime: 0,
                Pinned: false,
                Revision: 1,
                RevisionTime: 0,
                ShareCount: 0,
                State: ItemState.Active,
            };

            const openedItem = await PassCrypto.openItem({ shareId: encryptedShare.ShareID, encryptedItem });

            expect(openedItem.itemId).toEqual(encryptedItem.ItemID);
            expect(openedItem.content).toEqual(itemContent);
            expect(openedItem.revision).toEqual(encryptedItem.Revision);
            expect(openedItem.state).toEqual(encryptedItem.State);
        });
    });

    describe('PassCrypto::moveItem', () => {
        afterEach(() => PassCrypto.clear());

        test('should throw if PassCrypto not hydrated', async () => {
            await expect(PassCrypto.moveItem({} as any)).rejects.toThrow(PassCryptoNotHydratedError);
        });
    });
});

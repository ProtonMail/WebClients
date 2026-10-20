import { CryptoProxy } from '@protontech/crypto';

import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { DecryptedKey, Key } from '@proton/shared/lib/interfaces/Key';
import type { User } from '@proton/shared/lib/interfaces/User';
import noop from '@proton/utils/noop';

import type { FolderDataResponse, ItemRevisionContentsResponse, RotationKey, ShareKey } from '../../types';
import { ContentFormatVersion, ItemState } from '../../types';
import { logger } from '../../utils/logger';
import { obfuscate } from '../../utils/obfuscate/xor';
import {
    TEST_KEY_PASSWORD,
    TEST_USER_KEY_ID,
    createRandomKey,
    createRandomShareResponses,
    randomAddress,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/tests/fixtures/crypto';
import { PassCrypto } from '../crypto';
import * as processes from '../crypto/processes';
import { encodeFolder } from '../folders/folder-proto.transformer';
import { serializeItemContent } from '../items/item-proto.transformer';
import { createPassBridge } from './PassBridgeFactory';

describe('PassBridge', () => {
    const api = jest.fn();
    const bridge = createPassBridge(api);
    let userKey: DecryptedKey;

    /** Each test opens its own vault, as `getAllByShareId` caches its result per share */
    const openVault = async (): Promise<{ shareId: string; vaultKey: ShareKey }> => {
        const [encryptedShare, shareKey] = await createRandomShareResponses(userKey, userKey, 'addressId');
        await PassCrypto.openShare({ encryptedShare, encryptedShareKeys: [shareKey] });
        const vaultKey = await processes.openShareKey({ shareKey, userKeys: [userKey] });

        return { shareId: encryptedShare.ShareID, vaultKey };
    };

    const createEncryptedFolder = async (folderId: string, vaultKey: ShareKey): Promise<FolderDataResponse> => ({
        ...(await processes.createFolder({ content: encodeFolder({ name: 'Folder' }), parentKey: vaultKey })),
        FolderID: folderId,
        ParentFolderID: null,
        VaultID: 'vault-1',
    });

    const createEncryptedAlias = async (options: {
        itemId: string;
        name: string;
        encryptionKey: RotationKey;
        folderId: string | null;
    }): Promise<ItemRevisionContentsResponse> => {
        const content = serializeItemContent({
            type: 'alias',
            metadata: { name: options.name, note: obfuscate(''), itemUuid: options.itemId },
            content: {},
            extraFields: [],
        });

        const item = await processes.createItem({
            content,
            encryptionKey: options.encryptionKey,
            folderId: options.folderId,
        });

        return {
            AliasEmail: `${options.itemId}@proton.me`,
            Content: item.Content,
            ContentFormatVersion: ContentFormatVersion.Item,
            CreateTime: 0,
            Flags: 0,
            FolderID: options.folderId,
            ItemID: options.itemId,
            ItemKey: item.ItemKey,
            KeyRotation: item.KeyRotation,
            LastUseTime: 0,
            ModifyTime: 0,
            Pinned: false,
            Revision: 1,
            RevisionTime: 0,
            ShareCount: 0,
            State: ItemState.Active,
        };
    };

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        userKey = await createRandomKey();
        const user = {
            Keys: [
                {
                    ID: TEST_USER_KEY_ID,
                    PrivateKey: await CryptoProxy.exportPrivateKey({
                        privateKey: userKey.privateKey,
                        passphrase: TEST_KEY_PASSWORD,
                    }),
                    Version: 3,
                    Active: 1,
                } as Key,
            ],
        } as User;

        const address = {
            ...randomAddress(),
            Status: ADDRESS_STATUS.STATUS_ENABLED,
            Receive: ADDRESS_RECEIVE.RECEIVE_YES,
            Send: ADDRESS_SEND.SEND_YES,
        } as Address;

        const authStore = { getPassword: () => TEST_KEY_PASSWORD } as AuthenticationStore;
        await bridge.init({ user, addresses: [address], authStore });
    });

    afterAll(async () => releaseCryptoProxy());

    describe('alias.getAllByShareId', () => {
        test('resolves aliases stored in a folder', async () => {
            const { shareId, vaultKey } = await openVault();
            const encryptedFolder = await createEncryptedFolder('folder-1', vaultKey);
            const { folderKey } = await processes.openFolder({ encryptedFolder, parentKey: vaultKey });
            const encryptedAlias = await createEncryptedAlias({
                itemId: 'item-1',
                name: 'Alias in folder',
                encryptionKey: folderKey,
                folderId: 'folder-1',
            });

            api.mockImplementation(async ({ url }: { url: string }) => {
                if (url === `pass/v1/share/${shareId}/folder`) {
                    return { Folders: { Folders: [encryptedFolder], LastToken: null } };
                }
                if (url === `pass/v1/share/${shareId}/item`) {
                    return { Items: { RevisionsData: [encryptedAlias], LastToken: null } };
                }
                throw new Error(`Unexpected request ${url}`);
            });

            const aliases = await bridge.alias.getAllByShareId(shareId);

            expect(aliases).toHaveLength(1);
            expect(aliases[0].item.itemId).toEqual('item-1');
            expect(aliases[0].item.folderId).toEqual('folder-1');
            expect(aliases[0].item.data.metadata.name).toEqual('Alias in folder');
        });

        test('resolves aliases outside folders when the folders request fails', async () => {
            jest.spyOn(logger, 'warn').mockImplementation(noop);
            const { shareId, vaultKey } = await openVault();
            const encryptedFolder = await createEncryptedFolder('folder-2', vaultKey);
            const { folderKey } = await processes.openFolder({ encryptedFolder, parentKey: vaultKey });
            const encryptedAliasInRoot = await createEncryptedAlias({
                itemId: 'item-2',
                name: 'Alias in vault root',
                encryptionKey: vaultKey,
                folderId: null,
            });
            const encryptedAliasInFolder = await createEncryptedAlias({
                itemId: 'item-3',
                name: 'Alias in folder',
                encryptionKey: folderKey,
                folderId: 'folder-2',
            });

            api.mockImplementation(async ({ url }: { url: string }) => {
                if (url === `pass/v1/share/${shareId}/item`) {
                    return {
                        Items: { RevisionsData: [encryptedAliasInRoot, encryptedAliasInFolder], LastToken: null },
                    };
                }
                throw new Error(`Unexpected request ${url}`);
            });

            const aliases = await bridge.alias.getAllByShareId(shareId);

            expect(aliases).toHaveLength(1);
            expect(aliases[0].item.itemId).toEqual('item-2');
            expect(aliases[0].item.data.metadata.name).toEqual('Alias in vault root');
        });
    });
});

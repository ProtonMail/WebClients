import { type Base64, Role } from '../types';
import {
    convertAssetFromApi,
    convertAssetsFromApi,
    convertConversationFromApi,
    convertConversationsFromApi,
    convertMasterKeyFromApi,
    convertMessageFromApi,
    convertMessagesFromApi,
    convertRoleFromApi,
    convertRoleToApi,
    convertSpaceFromApi,
    convertSpacesFromApi,
    convertStatusFromApi,
    convertStatusToApi,
} from './conversion';
import {
    type LocalId,
    type RemoteAsset,
    type RemoteConversation,
    type RemoteDeletedAsset,
    type RemoteDeletedConversation,
    type RemoteId,
    RoleInt,
    StatusInt,
} from './types';

describe('remote - conversion', () => {
    const validBase64: Base64 = 'Dn8Rbu1slNpkebWPHcCSscVh3I4gM/uuZlPpf8ngUBBeVbdPeYCc';
    const now = new Date();
    const nowStr = now.toISOString();

    // Remote IDs (32-char base64)
    const REMOTE_SPACE_ID = 'spacespacespacespacespacespa==';
    const REMOTE_CONV_ID = 'convconvconconvconvconconvco==';
    const REMOTE_ASSET_ID = 'assetassetassetassetassetass==';
    const REMOTE_MESSAGE_ID = 'msgmsgmsgmsgmsgmsgmsgmsgmsgm==';
    const REMOTE_PARENT_MESSAGE_ID = 'parentmsgparentmsgparentmsgp==';

    // Local IDs (UUIDs)
    const LOCAL_SPACE_ID = '123e4567-e89b-12d3-456a-426614174000';
    const LOCAL_CONV_ID = '123e4567-e89b-12d3-456a-426614174001';
    const LOCAL_ASSET_ID = '123e4567-e89b-12d3-456a-426614174002';
    const LOCAL_MESSAGE_ID = '123e4567-e89b-12d3-456a-426614174003';
    const LOCAL_PARENT_MESSAGE_ID = '123e4567-e89b-12d3-456a-426614174004';

    describe('convertSpaceFromApi', () => {
        const validSpaceFromApi = {
            ID: REMOTE_SPACE_ID,
            CreateTime: nowStr,
            Encrypted: validBase64,
            SpaceKey: validBase64,
            SpaceTag: LOCAL_SPACE_ID,
            Conversations: [],
            Assets: [],
        };

        it('converts a valid space', () => {
            const result = convertSpaceFromApi(validSpaceFromApi);
            expect(result.space).toEqual({
                remoteId: REMOTE_SPACE_ID,
                id: LOCAL_SPACE_ID,
                createdAt: nowStr,
                wrappedSpaceKey: validBase64,
                deleted: false,
                encrypted: validBase64,
            });
            expect(result.conversations).toEqual([]);
            expect(result.deletedConversations).toEqual([]);
            expect(result.assets).toEqual([]);
            expect(result.deletedAssets).toEqual([]);
        });

        it('handles deleted space', () => {
            const deletedSpace = {
                ...validSpaceFromApi,
                DeleteTime: nowStr,
                Conversations: [
                    {
                        ID: REMOTE_CONV_ID,
                        SpaceID: REMOTE_SPACE_ID,
                        CreateTime: nowStr,
                        Encrypted: validBase64,
                        ConversationTag: LOCAL_CONV_ID,
                    },
                ],
                Assets: [
                    {
                        ID: REMOTE_ASSET_ID,
                        SpaceID: REMOTE_SPACE_ID,
                        CreateTime: nowStr,
                        Encrypted: validBase64,
                        AssetTag: LOCAL_ASSET_ID,
                    },
                ],
            };

            const result = convertSpaceFromApi(deletedSpace);
            expect(result.space.deleted).toBe(true);
            expect(result.conversations).toEqual([]);
            expect(result.deletedConversations).toHaveLength(1);
            expect(result.assets).toEqual([]);
            expect(result.deletedAssets).toHaveLength(1);
        });

        it('throws on invalid input', () => {
            expect(() => convertSpaceFromApi(null)).toThrow('Invalid input: expected object');
            expect(() => convertSpaceFromApi({ ...validSpaceFromApi, ID: '' })).toThrow('Invalid ID');
            expect(() => convertSpaceFromApi({ ...validSpaceFromApi, SpaceKey: 123456 })).toThrow('Invalid SpaceKey');
        });
    });

    describe('convertConversationFromApi', () => {
        const validConversationFromApi = {
            ID: REMOTE_CONV_ID,
            SpaceID: REMOTE_SPACE_ID,
            CreateTime: nowStr,
            IsStarred: true,
            Encrypted: validBase64,
            Messages: [],
            ConversationTag: LOCAL_CONV_ID,
        };

        it('converts a valid conversation', () => {
            const result = convertConversationFromApi(validConversationFromApi, LOCAL_SPACE_ID as LocalId);
            expect((result.conversation as RemoteConversation).encrypted).toEqual(validBase64);
            expect(result.conversation.remoteId).toEqual(REMOTE_CONV_ID);
            expect(result.conversation.id).toEqual(LOCAL_CONV_ID);
            expect(result.conversation.starred).toBe(true);
            expect(result.messages).toEqual([]);
        });

        it('handles deleted conversation', () => {
            const deletedConversation = {
                ...validConversationFromApi,
                DeleteTime: nowStr,
            };

            const result = convertConversationFromApi(deletedConversation, LOCAL_SPACE_ID as LocalId);
            expect((result.conversation as RemoteDeletedConversation).deleted).toBe(true);
            expect(result.messages).toEqual([]);
        });

        it('throws on invalid input', () => {
            expect(() => convertConversationFromApi(null, LOCAL_SPACE_ID)).toThrow('Invalid input');
            expect(() =>
                convertConversationFromApi({ ...validConversationFromApi, Encrypted: 'invalid' }, LOCAL_SPACE_ID)
            ).toThrow(/Invalid `encrypted` field/);
        });
    });

    describe('convertAssetFromApi', () => {
        const validAssetFromApi = {
            ID: REMOTE_ASSET_ID,
            SpaceID: REMOTE_SPACE_ID,
            CreateTime: nowStr,
            Encrypted: validBase64,
            AssetTag: LOCAL_ASSET_ID,
        };

        it('converts a valid asset', () => {
            const result = convertAssetFromApi(validAssetFromApi, LOCAL_SPACE_ID as LocalId) as RemoteAsset;
            expect(result.encrypted).toEqual(validBase64);
            expect(result.remoteId).toEqual(REMOTE_ASSET_ID);
            expect(result.id).toEqual(LOCAL_ASSET_ID);
            expect(result.deleted).toBe(false);
        });

        it('handles deleted asset', () => {
            const deletedAsset = {
                ...validAssetFromApi,
                DeleteTime: nowStr,
            };

            const result = convertAssetFromApi(deletedAsset, LOCAL_SPACE_ID as LocalId) as RemoteDeletedAsset;
            expect(result.deleted).toBe(true);
            expect(result.remoteId).toEqual(REMOTE_ASSET_ID);
        });

        it('throws on invalid input', () => {
            expect(() => convertAssetFromApi(null, LOCAL_SPACE_ID)).toThrow('Invalid input');
            expect(() => convertAssetFromApi({ ...validAssetFromApi, ID: '' }, LOCAL_SPACE_ID)).toThrow('Invalid ID');
        });
    });

    describe('convertMessageFromApi', () => {
        const validMessageFromApi = {
            ID: REMOTE_MESSAGE_ID,
            ConversationID: REMOTE_CONV_ID,
            CreateTime: nowStr,
            Role: RoleInt.User,
            MessageTag: LOCAL_MESSAGE_ID,
            Encrypted: validBase64,
        };

        it('converts a valid message', () => {
            const result = convertMessageFromApi(
                validMessageFromApi,
                LOCAL_CONV_ID as LocalId,
                undefined,
                REMOTE_CONV_ID as RemoteId
            );
            expect(result.encrypted).toEqual(validBase64);
            expect(result.remoteId).toEqual(REMOTE_MESSAGE_ID);
            expect(result.id).toEqual(LOCAL_MESSAGE_ID);
            expect(result.role).toEqual(Role.User);
        });

        it('handles message with parent', () => {
            const messageWithParent = {
                ...validMessageFromApi,
                ParentID: REMOTE_PARENT_MESSAGE_ID,
            };

            const result = convertMessageFromApi(
                messageWithParent,
                LOCAL_CONV_ID as LocalId,
                LOCAL_PARENT_MESSAGE_ID as LocalId,
                REMOTE_CONV_ID as RemoteId
            );
            expect(result.remoteParentId).toEqual(REMOTE_PARENT_MESSAGE_ID);
            expect(result.parentId).toEqual(LOCAL_PARENT_MESSAGE_ID);
        });

        it('throws on invalid input', () => {
            expect(() =>
                convertMessageFromApi(null, LOCAL_CONV_ID as LocalId, undefined, REMOTE_CONV_ID as RemoteId)
            ).toThrow('Invalid input');
            expect(() =>
                convertMessageFromApi(
                    { ...validMessageFromApi, Role: 999 },
                    LOCAL_CONV_ID as LocalId,
                    undefined,
                    REMOTE_CONV_ID as RemoteId
                )
            ).toThrow('Invalid role');
        });
    });

    describe('convertRoleFromApi and convertRoleToApi', () => {
        it('converts roles correctly', () => {
            expect(convertRoleFromApi(RoleInt.User)).toEqual(Role.User);
            expect(convertRoleFromApi(RoleInt.Assistant)).toEqual(Role.Assistant);
            expect(() => convertRoleFromApi(999 as RoleInt)).toThrow('Unknown RoleInt');

            expect(convertRoleToApi(Role.User)).toEqual(RoleInt.User);
            expect(convertRoleToApi(Role.Assistant)).toEqual(RoleInt.Assistant);
            expect(() => convertRoleToApi('system' as Role)).toThrow('Role "system" is not meant to be persisted');
        });
    });

    describe('convertStatusFromApi and convertStatusToApi', () => {
        it('converts status correctly', () => {
            expect(convertStatusFromApi(StatusInt.Succeeded)).toEqual('succeeded');
            expect(convertStatusFromApi(StatusInt.Failed)).toEqual('failed');
            expect(() => convertStatusFromApi(999 as StatusInt)).toThrow('Unknown StatusInt');

            expect(convertStatusToApi('succeeded')).toEqual(StatusInt.Succeeded);
            expect(convertStatusToApi('failed')).toEqual(StatusInt.Failed);
            expect(() => convertStatusToApi('unknown' as any)).toThrow('Unknown status');
        });
    });

    describe('convertMasterKeyFromApi', () => {
        const validMasterKeyFromApi = {
            ID: 'key-1',
            IsLatest: true,
            Version: 1,
            CreateTime: nowStr,
            MasterKey: 'master-key-1',
        };

        it('converts a valid master key', () => {
            const result = convertMasterKeyFromApi(validMasterKeyFromApi);
            expect(result.id).toEqual('key-1');
            expect(result.isLatest).toBe(true);
            expect(result.version).toEqual(1);
            expect(result.masterKey).toEqual('master-key-1');
            expect(result.createdAt).toEqual(nowStr);
        });

        it('throws on invalid input', () => {
            expect(() => convertMasterKeyFromApi({ ...validMasterKeyFromApi, ID: '' })).toThrow('Invalid ID');
            expect(() => convertMasterKeyFromApi({ ...validMasterKeyFromApi, Version: 0 })).toThrow('Invalid Version');
            expect(() => convertMasterKeyFromApi({ ...validMasterKeyFromApi, IsLatest: 'true' })).toThrow(
                'Invalid IsLatest'
            );
        });
    });

    describe('bulk conversion functions', () => {
        it('convertSpacesFromApi handles empty input', () => {
            const result = convertSpacesFromApi([]);
            expect(result.spaces).toEqual({});
            expect(result.deletedSpaces).toEqual({});
            expect(result.conversations).toEqual({});
            expect(result.deletedConversations).toEqual({});
        });

        it('convertConversationsFromApi handles empty input', () => {
            const result = convertConversationsFromApi([], LOCAL_SPACE_ID as LocalId);
            expect(result.conversations).toEqual([]);
            expect(result.deletedConversations).toEqual([]);
            expect(result.messages).toEqual([]);
        });

        it('convertAssetsFromApi handles empty input', () => {
            const result = convertAssetsFromApi([], LOCAL_SPACE_ID as LocalId);
            expect(result.assets).toEqual([]);
            expect(result.deletedAssets).toEqual([]);
        });

        it('convertMessagesFromApi handles empty input', () => {
            const result = convertMessagesFromApi([], LOCAL_CONV_ID as LocalId, REMOTE_CONV_ID as RemoteId);
            expect(result).toEqual([]);
        });
    });
});

import { base64ToMasterKey, decryptString, encryptString } from './crypto';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from './crypto/testing';
import {
    deserializeConversation,
    deserializeMessage,
    deserializeSpace,
    deserializeSpaceWithMasterKeys,
    serializeConversation,
    serializeMessage,
    serializeSpace,
} from './serialization';
import type { Conversation, Message, Space } from './types';
import { Role, SpaceType, getSpaceDek } from './types';

const mockSpace: Space = {
    spaceType: SpaceType.Default,
    id: 'SpaceId',
    createdAt: 'spaceCreationDate',
    updatedAt: 'spaceCreationDate',
    spaceKey: 'ABABABABABABABABABABABABABABABABABABABABABA=',
};

describe('serialization', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    it('space', async () => {
        const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');

        const serialized = await serializeSpace(mockSpace, masterKey);
        expect(serialized).not.toBeUndefined();
        const deserialized = await deserializeSpace(serialized!, masterKey);

        expect(deserialized).toEqual(mockSpace);
    });

    it('space decrypts with a legacy master key and flags migration', async () => {
        const legacyMasterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
        const primaryMasterKey = await base64ToMasterKey('CCCCCAQQQQQFFFFECCCCCAQQQQQFFFFECCCCCAQQQQQ=');

        const serialized = await serializeSpace(mockSpace, legacyMasterKey);
        const { space, needsMasterKeyMigration } = await deserializeSpaceWithMasterKeys(serialized, {
            primary: primaryMasterKey,
            legacy: [legacyMasterKey],
        });

        expect(space).toEqual(mockSpace);
        expect(needsMasterKeyMigration).toBe(true);
    });

    describe('space type compatibility', () => {
        // Frozen legacy associated data: changing a space's discriminator must not change its encryption context.
        const ad = '{"app":"lumo","id":"SpaceId","type":"space"}';
        const projectMetadata = {
            projectName: 'Research',
            projectInstructions: 'Use these files',
            projectIcon: 'science',
            linkedDriveFolder: { folderId: 'folder', folderName: 'Sources', folderPath: '/Sources' },
        };

        it.each([
            [{}, { spaceType: SpaceType.Default }],
            [{ isProject: false }, { spaceType: SpaceType.Default }],
            [{ isProject: null }, { spaceType: SpaceType.Default }],
            [{ isProject: 'true' }, { spaceType: SpaceType.Default }],
            [
                { isProject: true, ...projectMetadata },
                { spaceType: SpaceType.Project, ...projectMetadata },
            ],
        ])('reads legacy encrypted payloads without rewriting them: %p', async (legacy, expected) => {
            const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
            const { spaceType: _spaceType, ...serialized } = await serializeSpace(mockSpace, masterKey);
            serialized.encrypted = await encryptString(JSON.stringify(legacy), await getSpaceDek(mockSpace), ad);
            const before = JSON.stringify(serialized);
            const restored = await deserializeSpace(serialized, masterKey);
            expect(restored).toEqual({ ...mockSpace, ...expected });
            expect(restored).not.toHaveProperty('isProject');
            expect(JSON.stringify(serialized)).toBe(before);
            const saved = await serializeSpace(restored!, masterKey);
            const savedPayload = JSON.parse(await decryptString(saved.encrypted!, await getSpaceDek(mockSpace), ad));
            const { spaceType: type, ...expectedPrivate } = expected;
            expect(saved.spaceType).toBe(type);
            expect(savedPayload).toEqual({
                ...expectedPrivate,
                ...(type === SpaceType.Project && { isProject: true }),
            });
            expect(savedPayload).not.toHaveProperty('type');
            expect(savedPayload).not.toHaveProperty('spaceType');
            if (type !== SpaceType.Project) expect(savedPayload).not.toHaveProperty('isProject');
        });

        it.each([SpaceType.Default, SpaceType.Project, SpaceType.Schedule])(
            'writes the %s discriminator publicly and keeps project metadata encrypted',
            async (type) => {
                const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
                const space: Space =
                    type === SpaceType.Project
                        ? { ...mockSpace, spaceType: type, ...projectMetadata }
                        : { ...mockSpace, spaceType: type };
                const serialized = await serializeSpace(space, masterKey);
                const payload = JSON.parse(await decryptString(serialized.encrypted!, await getSpaceDek(space), ad));
                expect(serialized.spaceType).toBe(type);
                expect(payload).toEqual(type === SpaceType.Project ? { ...projectMetadata, isProject: true } : {});
                expect(payload).not.toHaveProperty('type');
                expect(payload).not.toHaveProperty('spaceType');
                if (type !== SpaceType.Project) expect(payload).not.toHaveProperty('isProject');
                expect(await deserializeSpace(serialized, masterKey)).toEqual(space);
            }
        );

        it.each([SpaceType.Default, SpaceType.Project])(
            'preserves %s when the API response omits public SpaceType',
            async (type) => {
                const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
                const space: Space =
                    type === SpaceType.Project
                        ? { ...mockSpace, spaceType: type, ...projectMetadata }
                        : { ...mockSpace, spaceType: type };
                const { spaceType: _spaceType, ...backendResponse } = await serializeSpace(space, masterKey);
                const restored = await deserializeSpace(backendResponse, masterKey);
                expect(restored).toEqual(space);
                expect(restored).not.toHaveProperty('isProject');
            }
        );

        it('prefers a public type over the legacy encrypted isProject flag', async () => {
            const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
            const serialized = await serializeSpace(
                { ...mockSpace, spaceType: SpaceType.Project, ...projectMetadata },
                masterKey
            );
            serialized.encrypted = await encryptString(
                JSON.stringify({ isProject: false, ...projectMetadata }),
                await getSpaceDek(mockSpace),
                ad
            );
            expect(await deserializeSpace(serialized, masterKey)).toEqual({
                ...mockSpace,
                spaceType: SpaceType.Project,
                ...projectMetadata,
            });
        });

        it('rejects unknown future types without changing the stored ciphertext', async () => {
            const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
            const serialized = await serializeSpace(mockSpace, masterKey);
            Object.assign(serialized, { spaceType: 'future-type' });
            const before = serialized.encrypted;
            expect(await deserializeSpace(serialized, masterKey)).toBeNull();
            expect(serialized.encrypted).toBe(before);
        });

        it.each([null, [], 'project'])('rejects invalid encrypted space metadata: %p', async (value) => {
            const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
            const serialized = await serializeSpace(mockSpace, masterKey);
            serialized.encrypted = await encryptString(JSON.stringify(value), await getSpaceDek(mockSpace), ad);
            expect(await deserializeSpace(serialized, masterKey)).toBeNull();
        });

        it('defaults legacy spaces without encrypted private metadata to Simple', async () => {
            const masterKey = await base64ToMasterKey('BBBBBAQQQQQEEEEEBBBBBAQQQQQEEEEEBBBBBAQQQQQ=');
            const {
                encrypted: _encrypted,
                spaceType: _spaceType,
                ...serialized
            } = await serializeSpace(mockSpace, masterKey);
            expect(await deserializeSpace(serialized, masterKey)).toEqual(mockSpace);
        });
    });

    it('conversation', async () => {
        const mockConversation: Conversation = {
            id: 'ConversationId',
            title: 'Conversation Title',
            spaceId: mockSpace.id,
            createdAt: 'conversationCreationDate',
            updatedAt: 'conversationCreationDate',
            starred: false,
        };

        const spaceDek = await getSpaceDek(mockSpace);
        const serialized = await serializeConversation(mockConversation, spaceDek);
        const deserialized = await deserializeConversation(serialized, spaceDek);

        expect(deserialized).toEqual(mockConversation);
    });

    it('message', async () => {
        const mockMessage: Message = {
            id: 'MessageId',
            createdAt: 'messageCreationData',
            role: Role.User,
            parentId: undefined,
            conversationId: 'ConversationId',
            placeholder: false,
            status: 'succeeded',
            content: 'this is a mocked message',
        };

        const spaceDek = await getSpaceDek(mockSpace);
        const serialized = await serializeMessage(mockMessage, spaceDek);
        expect(serialized).not.toBeNull();
        const deserialized = await deserializeMessage(serialized!, spaceDek);

        expect(deserialized).toEqual(mockMessage);
    });

    it('message with usage round-trips through encryption and the MessagePriv guard', async () => {
        const mockMessage: Message = {
            id: 'MessageId',
            createdAt: 'messageCreationData',
            role: Role.Assistant,
            parentId: 'ParentId',
            conversationId: 'ConversationId',
            placeholder: false,
            status: 'succeeded',
            content: 'answer',
            usage: {
                promptTokens: 696,
                completionTokens: 7,
                totalTokens: 703,
                ctxFilesTokenEstimate: 512,
            },
        };

        const spaceDek = await getSpaceDek(mockSpace);
        const serialized = await serializeMessage(mockMessage, spaceDek);
        expect(serialized).not.toBeNull();
        const deserialized = await deserializeMessage(serialized!, spaceDek);

        expect(deserialized).toEqual(mockMessage);
        expect(deserialized?.usage).toEqual(mockMessage.usage);
    });

    it('message with multiple finance tool blocks round-trips through encryption', async () => {
        const makeFinanceResult = (company: string, price: number) =>
            JSON.stringify({
                current_price: price,
                monthly_trend: [{ date: '2026-09-04', price, volume: 1 }],
                company_info: { name: company },
            });
        const googlCall = JSON.stringify({ id: 'call_0', name: 'stock', arguments: { symbol: 'GOOGL' } });
        const aaplCall = JSON.stringify({ id: 'call_1', name: 'stock', arguments: { symbol: 'AAPL' } });
        const metaCall = JSON.stringify({ id: 'call_2', name: 'stock', arguments: { symbol: 'META' } });

        const mockMessage: Message = {
            id: 'MessageId',
            createdAt: 'messageCreationData',
            role: Role.Assistant,
            parentId: 'ParentId',
            conversationId: 'ConversationId',
            placeholder: false,
            status: 'succeeded',
            blocks: [
                { type: 'tool_call', content: googlCall, toolCall: JSON.parse(googlCall) },
                { type: 'tool_call', content: aaplCall, toolCall: JSON.parse(aaplCall) },
                { type: 'tool_call', content: metaCall, toolCall: JSON.parse(metaCall) },
                {
                    type: 'tool_result',
                    content: makeFinanceResult('Alphabet Inc Class A', 338.46),
                    tool_call_id: 'call_0',
                },
                {
                    type: 'tool_result',
                    content: makeFinanceResult('Apple Inc.', 319.97),
                    tool_call_id: 'call_1',
                },
                {
                    type: 'tool_result',
                    content: makeFinanceResult('Meta Platforms Inc.', 616.77),
                    tool_call_id: 'call_2',
                },
                { type: 'text', content: 'Here is a quick comparison of the three stocks.' },
            ],
        };

        const spaceDek = await getSpaceDek(mockSpace);
        const serialized = await serializeMessage(mockMessage, spaceDek);
        expect(serialized).not.toBeNull();
        const deserialized = await deserializeMessage(serialized!, spaceDek);

        expect(deserialized).toEqual(mockMessage);
    });
});

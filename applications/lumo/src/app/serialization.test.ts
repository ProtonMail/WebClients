import { base64ToMasterKey } from './crypto';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from './crypto/testing';
import {
    deserializeConversation,
    deserializeMessage,
    deserializeSpace,
    serializeConversation,
    serializeMessage,
    serializeSpace,
} from './serialization';
import { type Conversation, type Message, Role, type Space, getSpaceDek } from './types';

const mockSpace: Space = {
    id: 'SpaceId',
    createdAt: 'spaceCreationDate',
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

    it('conversation', async () => {
        const mockConversation: Conversation = {
            id: 'ConversationId',
            title: 'Conversation Title',
            spaceId: mockSpace.id,
            createdAt: 'conversationCreationDate',
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
});

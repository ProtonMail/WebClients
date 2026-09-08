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

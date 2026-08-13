import type { Conversation } from '../../../types';
import { ConversationStatus, cleanConversation } from '../../../types';
import conversationsReducer, { addConversation } from './conversations';

/**
 * `status` is local-only: it lives in `ConversationExtra`, and `SerializedConversation` is
 * `ConversationPub & Encrypted & LocalFlags`, so it never reaches or returns from the server.
 *
 * A remote refresh landing mid-generation must therefore not be able to end the generation.
 * Doing so hides the stop button while the answer is still streaming, leaving no way to cancel.
 */
describe('remote conversation refresh vs. in-flight generation', () => {
    const generatingLocally: Conversation = {
        id: 'conv-1',
        spaceId: 'space-1',
        title: 'Half-written answer',
        createdAt: '2026-08-13T11:16:26.000Z',
        updatedAt: '2026-08-13T11:16:26.000Z',
        status: ConversationStatus.GENERATING,
    };

    // What `deserializeConversation` produces from a server payload: no `status`, because the
    // server has never heard of it.
    const asDeserializedFromRemote = (): Conversation => {
        const { status, ...withoutStatus } = generatingLocally;
        return withoutStatus as Conversation;
    };

    it('does not invent COMPLETED for a conversation that has no status', () => {
        expect(cleanConversation(asDeserializedFromRemote()).status).toBeUndefined();
    });

    it('keeps a locally generating conversation generating when a remote refresh lands', () => {
        const cleanRemote = cleanConversation(asDeserializedFromRemote());

        const state = conversationsReducer({ [generatingLocally.id]: generatingLocally }, addConversation(cleanRemote));

        expect(state[generatingLocally.id].status).toBe(ConversationStatus.GENERATING);
    });

    it('keeps a locally ghost conversation ghost when a remote refresh lands', () => {
        const ghostLocally: Conversation = { ...generatingLocally, ghost: true };
        const cleanRemote = cleanConversation(asDeserializedFromRemote());

        const state = conversationsReducer({ [ghostLocally.id]: ghostLocally }, addConversation(cleanRemote));

        expect(state[ghostLocally.id].ghost).toBe(true);
    });

    it('stores a brand new conversation as given', () => {
        const ghostAndGenerating: Conversation = { ...generatingLocally, ghost: true };

        const state = conversationsReducer({}, addConversation(ghostAndGenerating));

        expect(state[ghostAndGenerating.id]).toEqual(ghostAndGenerating);
    });
});

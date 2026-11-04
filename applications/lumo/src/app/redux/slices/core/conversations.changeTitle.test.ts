import type { Conversation } from '../../../types';
import type { ConversationMap } from './conversations';
import conversationsReducer, { changeConversationTitle } from './conversations';

/**
 * Titles arrive from the streaming path — a token at a time, then again on `ingesting` and once
 * more from the final `finishCallback` — long after the payload was built. Deleting the chat (or
 * navigating away and having it evicted) mid-generation therefore races the last dispatch, and
 * the reducer used to write through `state[id]` unguarded: `undefined is not an object
 * (evaluating 'e[a.id].title = a.title')`.
 */
describe('changeConversationTitle reducer', () => {
    const conversation: Conversation = {
        id: 'conv-1',
        spaceId: 'space-1',
        title: 'Untitled conversation',
        createdAt: '2026-11-04T02:55:08.000Z',
        updatedAt: '2026-11-04T02:55:08.000Z',
    };

    const changeTitle = () =>
        changeConversationTitle({
            id: conversation.id,
            spaceId: conversation.spaceId,
            title: 'Rename a file in the repo',
            persist: true,
        });

    it('renames the conversation', () => {
        const state: ConversationMap = { [conversation.id]: conversation };

        const next = conversationsReducer(state, changeTitle());

        expect(next[conversation.id].title).toBe('Rename a file in the repo');
    });

    it('is a no-op when the conversation is missing, instead of throwing', () => {
        const state: ConversationMap = {};

        const next = conversationsReducer(state, changeTitle());

        expect(next[conversation.id]).toBeUndefined();
    });

    it('leaves the other conversations untouched when the target is gone', () => {
        const other: Conversation = { ...conversation, id: 'conv-2', title: 'Another chat' };
        const state: ConversationMap = { [other.id]: other };

        const next = conversationsReducer(state, changeTitle());

        expect(next[other.id].title).toBe('Another chat');
    });
});

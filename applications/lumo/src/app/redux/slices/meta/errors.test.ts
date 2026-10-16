import { HARD_LIMIT_EXCEEDED_CODE } from '../../../constants/limits';
import { deleteConversation } from '../core/conversations';
import { deleteAllSpacesSuccess } from '../core/spaces';
import reducer, {
    addResourceLimitError,
    clearMessageLimitReached,
    dismissResourceLimitError,
    hydrateMessageLimitReached,
    selectIsMessageLimitReached,
} from './errors';

const getInitialState = () => reducer(undefined, { type: '@@INIT' });

const conversationFull = (conversationId: string) =>
    addResourceLimitError({ resource: 'messages', limit: 250, conversationId, code: HARD_LIMIT_EXCEEDED_CODE });

describe('message limit reached tracking', () => {
    it('locks the conversation when the server rejects a message for hitting the limit', () => {
        const state = reducer(getInitialState(), conversationFull('conv-1'));

        expect(selectIsMessageLimitReached('conv-1')({ errors: state })).toBe(true);
        expect(selectIsMessageLimitReached('conv-2')({ errors: state })).toBe(false);
    });

    it('keeps the conversation locked after the toast error is dismissed', () => {
        let state = reducer(getInitialState(), conversationFull('conv-1'));
        state = reducer(state, dismissResourceLimitError(state.resourceLimitErrors[0].id));

        expect(state.resourceLimitErrors).toHaveLength(0);
        expect(selectIsMessageLimitReached('conv-1')({ errors: state })).toBe(true);
    });

    it('does not lock on a messages 422 with a different code', () => {
        let state = reducer(
            getInitialState(),
            addResourceLimitError({ resource: 'messages', limit: 250, conversationId: 'conv-1', code: 2001 })
        );
        state = reducer(state, addResourceLimitError({ resource: 'messages', limit: 250, conversationId: 'conv-2' }));

        expect(state.messageLimitReachedConversations).toEqual({});
        expect(state.resourceLimitErrors).toHaveLength(2);
    });

    it('ignores limit errors for other resources or without a conversation', () => {
        let state = reducer(
            getInitialState(),
            addResourceLimitError({
                resource: 'assets',
                limit: 100,
                conversationId: 'conv-1',
                code: HARD_LIMIT_EXCEEDED_CODE,
            })
        );
        state = reducer(
            state,
            addResourceLimitError({ resource: 'messages', limit: 250, code: HARD_LIMIT_EXCEEDED_CODE })
        );

        expect(state.messageLimitReachedConversations).toEqual({});
        expect(selectIsMessageLimitReached(undefined)({ errors: state })).toBe(false);
    });

    it('hydrates persisted locks and clears a single one', () => {
        let state = reducer(getInitialState(), hydrateMessageLimitReached(['conv-1', 'conv-2']));
        state = reducer(state, clearMessageLimitReached('conv-1'));

        expect(selectIsMessageLimitReached('conv-1')({ errors: state })).toBe(false);
        expect(selectIsMessageLimitReached('conv-2')({ errors: state })).toBe(true);
    });

    it('drops the lock when the conversation is deleted', () => {
        let state = reducer(getInitialState(), hydrateMessageLimitReached(['conv-1', 'conv-2']));
        state = reducer(state, deleteConversation('conv-1'));

        expect(state.messageLimitReachedConversations).toEqual({ 'conv-2': true });
    });

    it('drops every lock when all spaces are deleted', () => {
        let state = reducer(getInitialState(), hydrateMessageLimitReached(['conv-1', 'conv-2']));
        state = reducer(state, deleteAllSpacesSuccess());

        expect(state.messageLimitReachedConversations).toEqual({});
    });
});

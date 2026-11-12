import { configureStore } from '@reduxjs/toolkit';

import type { Conversation } from '../../../types';
import type { LumoDispatch, LumoState } from '../../store';
import conversationsReducer, { pushConversationRequest, saveConversationModelTier } from './conversations';

const conversation: Conversation = {
    id: 'conversation-1',
    spaceId: 'space-1',
    title: 'A conversation',
    createdAt: '2026-10-21 00:00',
    updatedAt: '2026-10-21 00:00',
};

it.each([false, true])('remembers Answer Now and a subsequent manual choice (ghost: %s)', (ghost) => {
    const otherConversation = { ...conversation, id: 'conversation-2' };
    const store = configureStore({
        reducer: { conversations: conversationsReducer },
        preloadedState: {
            conversations: {
                [conversation.id]: { ...conversation, ghost },
                [otherConversation.id]: otherConversation,
            },
        },
    });
    const dispatch = jest.fn(store.dispatch) as unknown as jest.MockedFunction<LumoDispatch>;
    const getState = () => store.getState() as LumoState;

    saveConversationModelTier({ id: conversation.id, modelTier: 'lumo-lite', answerNowUsed: true })(dispatch, getState);
    expect(store.getState().conversations[conversation.id]).toEqual({
        ...conversation,
        ghost,
        modelTier: 'lumo-lite',
        answerNowUsed: true,
    });
    expect(store.getState().conversations[otherConversation.id]).toEqual(otherConversation);
    if (ghost) {
        expect(dispatch).not.toHaveBeenCalledWith(pushConversationRequest({ id: conversation.id }));
    } else {
        expect(dispatch).toHaveBeenCalledWith(pushConversationRequest({ id: conversation.id }));
    }

    saveConversationModelTier({ id: conversation.id, modelTier: 'lumo-max' })(dispatch, getState);
    expect(store.getState().conversations[conversation.id]).toEqual({
        ...conversation,
        ghost,
        modelTier: 'lumo-max',
        answerNowUsed: true,
    });
});

it('does not recreate or push a conversation deleted before the request completes', () => {
    const dispatch = jest.fn();
    saveConversationModelTier({ id: conversation.id, modelTier: 'lumo-lite', answerNowUsed: true })(
        dispatch,
        () => ({ conversations: {} }) as LumoState
    );
    expect(dispatch).not.toHaveBeenCalled();
});

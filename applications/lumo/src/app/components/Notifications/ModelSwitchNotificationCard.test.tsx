import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen } from '@testing-library/react';

import conversationsReducer, { saveConversationModelTier } from '../../redux/slices/core/conversations';
import type { LumoDispatch } from '../../redux/store';
import { setRemainingLimits } from '../../services/usageLimitsStore';
import { type Conversation, type Message, Role } from '../../types';
import { markModelSwitchNotificationDismissed } from '../../util/modelSwitchNotificationStorage';
import { ModelSwitchNotificationCard } from './ModelSwitchNotificationCard';

jest.mock('../../redux/hooks', () => {
    const { useSelector } = jest.requireActual('react-redux');
    return { useLumoSelector: useSelector };
});
jest.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../hooks/useLumoPlan', () => ({ useLumoPlan: () => ({ hasLumoPlus: false }) }));
jest.mock('../../hooks/useMaxModelAvailability', () => ({
    useMaxModelAvailability: () => ({ isMaxAvailableByFlag: true }),
}));
jest.mock('../../hooks/useTierErrors', () => ({ useTierErrors: () => ({ hasTierErrors: false }) }));
jest.mock('../../providers/ModelTierProvider', () => ({
    getSelectedModelTier: (modelTier: string) => modelTier,
    useModelTier: () => ({ modelTier: 'lumo-lite', setModelTier: jest.fn() }),
}));
jest.mock('../../util/modelSwitchNotificationStorage', () => ({
    hasDismissedModelSwitchNotification: () => false,
    markModelSwitchNotificationDismissed: jest.fn(),
}));

const conversation: Conversation = {
    id: 'conversation-1',
    title: 'First conversation',
    spaceId: 'space-1',
    createdAt: '2026-10-21 00:00',
    updatedAt: '2026-10-21 00:00',
};

const message: Message = {
    id: 'message-1',
    conversationId: conversation.id,
    createdAt: '2026-10-21 00:00',
    role: Role.User,
    content: 'Hello',
};

it('suppresses the Max promotion only for conversations that have used Answer Now', () => {
    setRemainingLimits({ lite: 10, max: 10 });
    const otherConversation = { ...conversation, id: 'conversation-2' };
    const store = configureStore({
        reducer: { conversations: conversationsReducer },
        preloadedState: {
            conversations: { [conversation.id]: conversation, [otherConversation.id]: otherConversation },
        },
    });
    const view = (conversationId: string) => {
        return (
            <Provider store={store}>
                <ModelSwitchNotificationCard
                    messageChain={[
                        { ...message, conversationId },
                        { ...message, conversationId, id: 'message-2', role: Role.Assistant },
                    ]}
                />
            </Provider>
        );
    };
    const { rerender } = render(view(conversation.id));
    expect(screen.getByRole('button', { name: 'Switch to Max' })).toBeInTheDocument();

    act(() => {
        (store.dispatch as LumoDispatch)(
            saveConversationModelTier({
                id: conversation.id,
                modelTier: 'lumo-lite',
                answerNowUsed: true,
            })
        );
    });
    expect(screen.queryByText(/Switch to Max for more capable answers/)).not.toBeInTheDocument();
    rerender(view(otherConversation.id));
    expect(screen.getByRole('button', { name: 'Switch to Max' })).toBeInTheDocument();
    rerender(view(conversation.id));
    expect(screen.queryByRole('button', { name: 'Switch to Max' })).not.toBeInTheDocument();
    expect(markModelSwitchNotificationDismissed).not.toHaveBeenCalled();
});

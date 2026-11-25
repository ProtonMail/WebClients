import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { IsGuestProvider } from '../../../../../providers/IsGuestProvider';
import { LumoPlanProvider } from '../../../../../providers/LumoPlanProvider';
import { ModelTierContext } from '../../../../../providers/modelTierContext';
import messagesReducer, { finishMessage } from '../../../../../redux/slices/core/messages';
import errorsReducer from '../../../../../redux/slices/meta/errors';
import { setRemainingLimits } from '../../../../../services/usageLimitsStore';
import type { Message } from '../../../../../types';
import { Role } from '../../../../../types-api';
import AssistantMessage from './AssistantMessage';
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
vi.mock('../../../../../providers/WebSearchProvider', () => ({
    useWebSearch: () => ({ isWebSearchButtonToggled: false }),
}));

const loadingMessage: Message = {
    id: 'response',
    parentId: 'request',
    conversationId: 'conversation',
    createdAt: '2026-11-09T12:00:00Z',
    content: '',
    role: Role.Assistant,
    placeholder: true,
};

beforeEach(() => setRemainingLimits({ lite: 1, max: 1 }));

function renderResponse(message: Message, isGenerating = false) {
    const store = configureStore({
        reducer: {
            errors: errorsReducer,
            attachments: () => ({}),
            contextFilters: () => ({ filters: [] }),
        },
    });
    const onRetryPanelToggle = vi.fn();
    render(
        <Provider store={store} context={ProtonStoreContext}>
            <IsGuestProvider isGuest>
                <LumoPlanProvider>
                    <ModelTierContext.Provider
                        value={{
                            modelTier: 'lumo-lite',
                            setModelTier: vi.fn(),
                            setModelTierWithoutPersist: vi.fn(),
                            responseMode: 'fast',
                            setResponseMode: vi.fn(),
                            setResponseModeWithoutPersist: vi.fn(),
                            isThinkingEnabled: false,
                        }}
                    >
                        <AssistantMessage
                            message={message}
                            isRunning={isGenerating}
                            isGenerating={isGenerating}
                            siblingInfo={{ idx: 0, count: 1, onPrev: vi.fn(), onNext: vi.fn() }}
                            messageChainRef={{ current: null }}
                            sourcesContainerRef={{ current: null }}
                            handleRegenerateMessage={vi.fn()}
                            handleOpenSources={vi.fn()}
                            handleOpenFiles={vi.fn()}
                            messageChain={[message]}
                            onToggleMessageSource={vi.fn()}
                            onToggleFilesManagement={vi.fn()}
                            onRetryPanelToggle={onRetryPanelToggle}
                        />
                    </ModelTierContext.Provider>
                </LumoPlanProvider>
            </IsGuestProvider>
        </Provider>
    );

    return onRetryPanelToggle;
}

it('allows reopening regenerate after a response stream fails', () => {
    // The stream finish callback dispatches this action when the transport fails.
    const messages = messagesReducer(
        { response: loadingMessage },
        finishMessage({
            messageId: 'response',
            conversationId: 'conversation',
            spaceId: 'space',
            content: '',
            role: Role.Assistant,
            status: 'failed',
        })
    );
    const onRetryPanelToggle = renderResponse(messages.response);

    const regenerate = screen.getByRole('button', { name: 'Regenerate' });
    expect(regenerate).toBeEnabled();
    fireEvent.click(regenerate);
    expect(onRetryPanelToggle).toHaveBeenCalledWith('response', true, regenerate);
});

it('keeps regenerate disabled while a response is still streaming', () => {
    renderResponse(loadingMessage, true);

    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeDisabled();
});

it('allows regenerate after a successful response', () => {
    renderResponse({ ...loadingMessage, placeholder: false, status: 'succeeded' });

    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeEnabled();
});

it('keeps regenerate disabled when the selected model allocation is exhausted', () => {
    setRemainingLimits({ lite: 0, max: 1 });
    renderResponse({ ...loadingMessage, placeholder: false, status: 'failed' });

    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeDisabled();
});

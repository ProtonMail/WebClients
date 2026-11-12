import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import conversationsReducer, { addConversation, saveConversationModelTier } from '../redux/slices/core/conversations';
import type { LumoDispatch } from '../redux/store';
import { setRemainingLimits } from '../services/usageLimitsStore';
import { type Conversation, Role } from '../types';
import { ModelTierProvider, useModelTier } from './ModelTierProvider';
import type { ModelTier } from './modelTierConstants';

let preferredModelTier: ModelTier = 'lumo-max';
const updateSettings = jest.fn((settings: { preferredModelTier?: ModelTier }) => {
    if (settings.preferredModelTier !== undefined) {
        preferredModelTier = settings.preferredModelTier;
    }
});
const api = jest.fn();
jest.mock('../redux/hooks', () => {
    const { useDispatch, useSelector } = jest.requireActual('react-redux');
    return { useLumoDispatch: useDispatch, useLumoSelector: useSelector };
});
jest.mock('../hooks/useLumoUserSettings', () => ({
    useLumoUserSettings: () => ({
        lumoUserSettings: { preferredModelTier, preferredResponseMode: 'thinking' },
        updateSettings,
    }),
}));
jest.mock('../hooks/useLumoFlags', () => ({
    useLumoFlags: () => ({ apertusModelAvailable: true, previewModelAvailable: true }),
}));
jest.mock('../hooks/useMaxModelAvailability', () => ({
    useMaxModelAvailability: () => ({ isMaxAvailableByFlag: true }),
}));
jest.mock('./IsGuestProvider', () => ({ useIsGuest: () => false }));
jest.mock('./LumoPlanProvider', () => ({ useLumoPlan: () => ({ hasLumoPlus: false }) }));
jest.mock('../components/Modals/ApertusOnboardingModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../util/userAgent', () => ({ canUseNewModel: () => true, canUsePreviewModel: () => true }));

const conversation: Conversation = {
    id: 'conversation-1',
    title: 'First conversation',
    spaceId: 'space-1',
    createdAt: '2026-10-21 00:00',
    updatedAt: '2026-10-21 00:00',
};

const ModelPicker = () => {
    const { modelTier, setModelTier, responseMode } = useModelTier();
    return (
        <>
            <output>{modelTier}</output>
            <span>{responseMode}</span>
            <button onClick={() => setModelTier('lumo-max')}>Select Max</button>
            <button onClick={() => setModelTier('lumo-lite')}>Select Lite</button>
            <button
                onClick={async () => {
                    const client = new LumoApiClient({ enableU2LEncryption: false, enableSmoothing: false });
                    await client.callAssistant(api as Api, [{ role: Role.User, content: 'Follow up' }], { modelTier });
                }}
            >
                Send
            </button>
        </>
    );
};

const setup = (modelTier?: ModelTier) => {
    const secondConversation = { ...conversation, id: 'conversation-2' };
    const store = configureStore({
        reducer: { conversations: conversationsReducer },
        preloadedState: {
            conversations: {
                [conversation.id]: { ...conversation, ...(modelTier && { modelTier, answerNowUsed: true }) },
                [secondConversation.id]: secondConversation,
            },
        },
    });
    const view = (conversationId?: string) => {
        return (
            <Provider store={store}>
                <ModelTierProvider conversationId={conversationId}>
                    <ModelPicker />
                </ModelTierProvider>
            </Provider>
        );
    };
    const { rerender } = render(view(conversation.id));
    return { store, navigate: (id?: string) => rerender(view(id)) };
};

beforeEach(() => {
    jest.clearAllMocks();
    preferredModelTier = 'lumo-max';
    api.mockImplementation(
        async () =>
            new ReadableStream({
                start(controller) {
                    controller.enqueue(
                        new TextEncoder().encode(
                            'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'
                        )
                    );
                    controller.close();
                },
            })
    );
    setRemainingLimits({ lite: 10, max: 10 });
});

it('restores each conversation choice and uses the unchanged preference for new conversations', () => {
    const { store, navigate } = setup();
    expect(screen.getByRole('status')).toHaveTextContent('lumo-max');

    act(() => {
        (store.dispatch as LumoDispatch)(
            saveConversationModelTier({ id: conversation.id, modelTier: 'lumo-lite', answerNowUsed: true })
        );
    });
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    expect(screen.getByText('thinking')).toBeInTheDocument();
    expect(updateSettings).not.toHaveBeenCalled();

    navigate('conversation-2');
    expect(screen.getByRole('status')).toHaveTextContent('lumo-max');
    navigate();
    expect(screen.getByRole('status')).toHaveTextContent('lumo-max');
    navigate(conversation.id);
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
});

it('updates the default after manual selections while preserving the Answer Now promotion dismissal', () => {
    const { store, navigate } = setup('lumo-lite');
    fireEvent.click(screen.getByRole('button', { name: 'Select Max' }));
    expect(screen.getByRole('status')).toHaveTextContent('lumo-max');
    expect(store.getState().conversations[conversation.id]).toMatchObject({
        modelTier: 'lumo-max',
        answerNowUsed: true,
    });
    expect(updateSettings).toHaveBeenLastCalledWith({ preferredModelTier: 'lumo-max', _autoSave: true });

    fireEvent.click(screen.getByRole('button', { name: 'Select Lite' }));
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    navigate();
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    expect(updateSettings).toHaveBeenLastCalledWith({ preferredModelTier: 'lumo-lite', _autoSave: true });
});

it('uses a saved choice on reload and responds to a synced conversation update', async () => {
    const { store } = setup('lumo-lite');
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    act(() => {
        store.dispatch(addConversation({ ...conversation, modelTier: 'lumo-max', answerNowUsed: true }));
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('lumo-max'));
    expect(updateSettings).not.toHaveBeenCalled();
});

it('keeps the explicit Lite choice when quota changes instead of automatically returning to Max', () => {
    setup('lumo-lite');
    act(() => setRemainingLimits({ lite: 0, max: 10 }));
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    act(() => setRemainingLimits({ lite: 10, max: 10 }));
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    expect(updateSettings).not.toHaveBeenCalled();
});

it('still saves a model choice made on the new-conversation page as the default', () => {
    const { navigate } = setup();
    navigate();
    fireEvent.click(screen.getByRole('button', { name: 'Select Lite' }));
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    expect(updateSettings).toHaveBeenCalledWith({ preferredModelTier: 'lumo-lite', _autoSave: true });
});

it('sends the next message to Lite only in the conversation that used Answer Now', async () => {
    const { navigate } = setup('lumo-lite');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    model: 'lumo-lite',
                    messages: [{ role: 'user', content: 'Follow up' }],
                }),
            })
        )
    );

    navigate('conversation-2');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    model: 'lumo-max',
                    messages: [{ role: 'user', content: 'Follow up' }],
                }),
            })
        )
    );

    navigate();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api).toHaveBeenCalledTimes(3));
    expect(api).toHaveBeenLastCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({ model: 'lumo-max', messages: [{ role: 'user', content: 'Follow up' }] }),
        })
    );
    expect(updateSettings).not.toHaveBeenCalled();
});

it('uses a manual model selection for the current conversation and future conversations', async () => {
    const { store, navigate } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Select Lite' }));
    expect(store.getState().conversations[conversation.id].modelTier).toBe('lumo-lite');
    expect(store.getState().conversations[conversation.id].answerNowUsed).toBeUndefined();
    expect(updateSettings).toHaveBeenLastCalledWith({ preferredModelTier: 'lumo-lite', _autoSave: true });

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
    expect(api).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ model: 'lumo-lite' }) })
    );

    navigate();
    expect(screen.getByRole('status')).toHaveTextContent('lumo-lite');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    expect(api).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ model: 'lumo-lite' }) })
    );
});

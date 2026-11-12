import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import type { AnswerNowPrompt } from '@proton/lumo-api-client/types-api';

import conversationsReducer from '../../../../../redux/slices/core/conversations';
import { AnswerNowButtonContainerContext, AnswerNowNotice } from './AnswerNowNotice';

const conversation = {
    id: 'conversation-1',
    title: 'First conversation',
    spaceId: 'space-1',
    createdAt: '2026-10-21 00:00',
    updatedAt: '2026-10-21 00:00',
};
const createStore = () => {
    return configureStore({
        reducer: { conversations: conversationsReducer },
        preloadedState: {
            conversations: {
                [conversation.id]: conversation,
                'conversation-2': { ...conversation, id: 'conversation-2' },
            },
        },
    });
};
let store = createStore();
jest.mock('../../../../../redux/hooks', () => ({ useLumoDispatch: () => store.dispatch }));
const api = jest.fn();
const createNotification = jest.fn();
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => api }));
jest.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification }) }));
const prompt: AnswerNowPrompt = {
    object: 'lumo.answer_now',
    job_id: 'job-1',
    wait: 4000,
};
beforeEach(() => {
    jest.clearAllMocks();
    store = createStore();
});
it('switches in place, accepts an empty 204 response, and disables duplicate clicks', async () => {
    api.mockImplementationOnce(({ output }: { output?: string }) =>
        output === 'raw'
            ? Promise.resolve({ status: 204 })
            : Promise.reject(new SyntaxError('Unexpected end of JSON input'))
    );
    const { rerender } = render(<AnswerNowNotice prompt={prompt} conversationId={conversation.id} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer now' }));
    await waitFor(() =>
        expect(api).toHaveBeenCalledWith({
            method: 'post',
            output: 'raw',
            url: 'ai/v1/jobs/job-1/answer-now',
            silence: true,
        })
    );
    await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
    expect(screen.getByText('Requesting an answer…')).toBeInTheDocument();
    rerender(<AnswerNowNotice prompt={{ ...prompt, wait: 3000 }} conversationId={conversation.id} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(api).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Connecting to/)).not.toBeInTheDocument();
    expect(store.getState().conversations[conversation.id]).toMatchObject({
        modelTier: 'lumo-lite',
        answerNowUsed: true,
    });
    expect(store.getState().conversations['conversation-2']).toEqual({ ...conversation, id: 'conversation-2' });
});
it('shows only the waiting message and button, without a duration', () => {
    render(<AnswerNowNotice prompt={prompt} conversationId={conversation.id} />);
    expect(screen.getByText('Working on it...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Answer now' })).toBeInTheDocument();
    expect(screen.queryByText(/about|4000|4s/)).not.toBeInTheDocument();
});
it('allows retry after a broadcast failure', async () => {
    api.mockRejectedValueOnce(new Error('unreachable'));
    render(<AnswerNowNotice prompt={prompt} conversationId={conversation.id} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer now' }));
    await waitFor(() => expect(createNotification).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Answer now' })).not.toBeDisabled();
    expect(store.getState().conversations[conversation.id]).toEqual(conversation);
});

it('remembers the originating conversation even if the user navigates before the request succeeds', async () => {
    let finishRequest!: (response: { status: number }) => void;
    api.mockReturnValueOnce(
        new Promise((resolve) => {
            finishRequest = resolve;
        })
    );
    const { rerender } = render(<AnswerNowNotice prompt={prompt} conversationId={conversation.id} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer now' }));
    expect(store.getState().conversations[conversation.id]).toEqual(conversation);
    rerender(<AnswerNowNotice prompt={{ ...prompt, job_id: 'job-2' }} conversationId="conversation-2" />);
    finishRequest({ status: 204 });
    await waitFor(() =>
        expect(store.getState().conversations[conversation.id]).toMatchObject({
            modelTier: 'lumo-lite',
            answerNowUsed: true,
        })
    );
    expect(store.getState().conversations['conversation-2']).toEqual({ ...conversation, id: 'conversation-2' });
    expect(screen.getByRole('button', { name: 'Answer now' })).toBeEnabled();
});

it('keeps the waiting status in the message while the floating pill switches the conversation', async () => {
    api.mockResolvedValueOnce({ status: 204 });
    const buttonContainer = document.createElement('div');
    render(
        <AnswerNowButtonContainerContext.Provider value={buttonContainer}>
            <AnswerNowNotice prompt={prompt} conversationId={conversation.id} />
        </AnswerNowButtonContainerContext.Provider>
    );

    expect(screen.getByText('Working on it...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Answer now' })).not.toBeInTheDocument();
    fireEvent.click(within(buttonContainer).getByRole('button', { name: 'Answer now' }));

    await waitFor(() => expect(screen.getByText('Requesting an answer…')).toBeInTheDocument());
    expect(within(buttonContainer).queryByRole('button')).toBeNull();
    expect(store.getState().conversations[conversation.id]).toMatchObject({
        modelTier: 'lumo-lite',
        answerNowUsed: true,
    });
});

it('disables the retained pill immediately when Max starts and enables a new queued job', () => {
    const { rerender } = render(<AnswerNowNotice prompt={prompt} conversationId={conversation.id} />);
    const button = screen.getByRole('button', { name: 'Answer now' });

    rerender(<AnswerNowNotice conversationId={conversation.id} />);
    expect(screen.queryByRole('button', { name: 'Answer now' })).not.toBeInTheDocument();
    expect(screen.queryByText('Working on it...')).not.toBeInTheDocument();
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(api).not.toHaveBeenCalled();

    rerender(<AnswerNowNotice prompt={{ ...prompt, job_id: 'job-2' }} conversationId={conversation.id} />);
    expect(screen.getByRole('button', { name: 'Answer now' })).toBeEnabled();
    expect(screen.getByText('Working on it...')).toBeInTheDocument();
});

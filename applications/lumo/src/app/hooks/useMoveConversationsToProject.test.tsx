import { renderToStaticMarkup } from 'react-dom/server';

import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import {
    type MoveConversationToSpaceFailure,
    moveConversationToSpaceFailure,
    moveConversationToSpaceRequest,
    moveConversationToSpaceSuccess,
} from '../redux/slices/core/conversations';
import { movingConversations } from './useMoveConversationToProject';
import { useMoveConversationsToProject } from './useMoveConversationsToProject';

const createNotification = jest.fn((_options: { text: React.ReactNode; type?: string }) => {
    return 1;
});
const hideNotification = jest.fn();

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification, hideNotification }),
}));
jest.mock('./useLumoNavigate', () => ({ useLumoNavigate: () => jest.fn() }));
jest.mock('../util/telemetry', () => ({ sendConversationMoveToProjectEvent: jest.fn() }));

let store: ReturnType<typeof makeStore>;
jest.mock('../redux/hooks', () => ({
    useLumoDispatch: () => store.dispatch,
}));

/** A store whose fake move saga answers each request with the outcome set for that chat. */
const makeStore = (
    outcomes: Record<string, true | MoveConversationToSpaceFailure['reason'] | 'other'>,
    order: string[]
) => {
    const listener = createListenerMiddleware();
    listener.startListening({
        actionCreator: moveConversationToSpaceRequest,
        effect: async (action, api) => {
            const { conversationId, attemptId, targetSpaceId } = action.payload;
            order.push(`start:${conversationId}`);
            await Promise.resolve();
            order.push(`end:${conversationId}`);
            const outcome = outcomes[conversationId];
            if (outcome === true) {
                api.dispatch(
                    moveConversationToSpaceSuccess({
                        conversationId,
                        attemptId,
                        targetSpaceId,
                        newConversationId: `${conversationId}-moved`,
                    } as never)
                );
                return;
            }
            api.dispatch(
                moveConversationToSpaceFailure({
                    conversationId,
                    attemptId,
                    targetSpaceId,
                    error: 'failed',
                    reason: outcome === 'other' ? undefined : outcome,
                })
            );
        },
    });
    return configureStore({
        reducer: () => ({}),
        middleware: (getDefault) => getDefault().prepend(listener.middleware),
    });
};

const lastMessage = () => {
    const call = createNotification.mock.calls[createNotification.mock.calls.length - 1]![0];
    return {
        text: renderToStaticMarkup(<>{call.text}</>)
            .replace(/<[^>]+>/g, ' ')
            .replace(/&#x27;/g, "'")
            .replace(/\s+/g, ' ')
            .trim(),
        type: call.type,
    };
};

const run = async (ids: string[]) => {
    const { result } = renderHook(() => useMoveConversationsToProject());
    await act(async () => {
        await result.current.moveToProject(ids, 'space-target', 'Trips');
    });
};

describe('useMoveConversationsToProject', () => {
    beforeEach(() => {
        createNotification.mockClear();
        hideNotification.mockClear();
        movingConversations.clear();
    });

    it('moves chats one after another and reports them all with View', async () => {
        const order: string[] = [];
        store = makeStore({ a: true, b: true, c: true }, order);

        await run(['a', 'b', 'c']);

        expect(order).toEqual(['start:a', 'end:a', 'start:b', 'end:b', 'start:c', 'end:c']);
        expect(lastMessage()).toEqual({ text: '3 chats moved to Trips View', type: undefined });
        expect(movingConversations.size).toBe(0);
    });

    it('reports partial success with the shared reason and keeps View', async () => {
        store = makeStore({ a: true, b: 'limit', c: 'limit' }, []);

        await run(['a', 'b', 'c']);

        expect(lastMessage()).toEqual({
            text: "1 of 3 chats moved to Trips. 2 couldn't be moved: Trips has reached its limit of chats or files. View",
            type: 'warning',
        });
    });

    it('uses the general reason when failures differ', async () => {
        store = makeStore({ a: true, b: 'limit', c: 'busy' }, []);

        await run(['a', 'b', 'c']);

        expect(lastMessage().text).toContain("couldn't be moved: Couldn't move the chat. Please try again.");
    });

    it('shows only the error when nothing moved', async () => {
        store = makeStore({ a: 'privacy', b: 'privacy' }, []);

        await run(['a', 'b']);

        expect(lastMessage()).toEqual({
            text: 'Chats in a private project can only be moved to another private project.',
            type: 'error',
        });
    });

    it('skips chats that are already being moved', async () => {
        const order: string[] = [];
        store = makeStore({ a: true, b: true }, order);
        movingConversations.add('a');

        await run(['a', 'b']);

        expect(order).toEqual(['start:b', 'end:b']);
        expect(lastMessage().text).toBe('1 chat moved to Trips View');
    });
});

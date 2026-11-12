import type { UnknownAction } from '@reduxjs/toolkit';
import { runSaga } from 'redux-saga';

import type { DbApi } from '../../indexedDb/db';
import type { SerializedMessage } from '../../types';
import { deleteMessage, pushMessageNoop, pushMessageSuccess } from '../slices/core/messages';
import type { LumoState } from '../store';
import { pushMessage } from './messages';

const messageId = 'msg-tombstone';
const conversationId = 'conv-1';

const createDeletedDirtyTombstone = (): SerializedMessage =>
    ({
        id: messageId,
        conversationId,
        createdAt: '2026-01-01T00:00:00.000Z',
        role: 'user',
        deleted: true,
        dirty: true,
    }) as SerializedMessage;

const createState = (): LumoState =>
    ({
        messages: {},
        conversations: {},
        ghostChat: { isGhostChatMode: false },
    }) as LumoState;

const runPushMessage = async (idbMessage: SerializedMessage | undefined, state = createState()) => {
    const dispatched: UnknownAction[] = [];
    const dbApi = {
        getMessageById: jest.fn(async () => idbMessage),
        updateMessage: jest.fn(async (_message: SerializedMessage, { dirty }: { dirty: boolean }) => {
            if (idbMessage) {
                idbMessage.dirty = dirty;
            }
        }),
    } as unknown as DbApi;

    await runSaga(
        {
            context: { dbApi },
            dispatch: (action: UnknownAction) => {
                dispatched.push(action);
            },
            getState: () => state,
        },
        pushMessage,
        { payload: { id: messageId } }
    ).toPromise();

    return { dispatched, dbApi };
};

describe('pushMessage saga', () => {
    it('clears dirty deleted tombstones without requiring the message in Redux', async () => {
        const tombstone = createDeletedDirtyTombstone();
        const { dispatched, dbApi } = await runPushMessage(tombstone);

        expect(dbApi.getMessageById).toHaveBeenCalledWith(messageId);
        expect(dbApi.updateMessage).toHaveBeenCalledWith(tombstone, { dirty: false });
        expect(dispatched).toEqual([deleteMessage(messageId), pushMessageSuccess({ id: messageId })]);
        expect(tombstone.dirty).toBe(false);
    });

    it('noops when a deleted tombstone is already synced', async () => {
        const tombstone = { ...createDeletedDirtyTombstone(), dirty: false };
        const { dispatched, dbApi } = await runPushMessage(tombstone);

        expect(dbApi.updateMessage).not.toHaveBeenCalled();
        expect(dispatched).toEqual([pushMessageNoop({ id: messageId })]);
    });
});

describe('background message persistence in ghost mode', () => {
    it('processes a normal conversation while a ghost chat is visible', async () => {
        const state = {
            ...createState(),
            ghostChat: { isGhostChatMode: true },
            conversations: { [conversationId]: { ghost: false } },
        } as unknown as LumoState;
        const tombstone = createDeletedDirtyTombstone();
        const { dispatched, dbApi } = await runPushMessage(tombstone, state);
        expect(dbApi.updateMessage).toHaveBeenCalledWith(tombstone, { dirty: false });
        expect(dispatched).toEqual([deleteMessage(messageId), pushMessageSuccess({ id: messageId })]);
    });

    it('never persists a ghost conversation while a normal chat is visible', async () => {
        const state = {
            ...createState(),
            messages: { [messageId]: { conversationId } },
            conversations: { [conversationId]: { ghost: true } },
        } as unknown as LumoState;
        const { dispatched, dbApi } = await runPushMessage(undefined, state);
        expect(dbApi.getMessageById).not.toHaveBeenCalled();
        expect(dbApi.updateMessage).not.toHaveBeenCalled();
        expect(dispatched).toEqual([pushMessageSuccess({ id: messageId })]);
    });
});

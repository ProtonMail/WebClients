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
        ghostChat: { isGhostChatMode: false },
    }) as LumoState;

const runPushMessage = async (idbMessage: SerializedMessage | undefined) => {
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
            getState: () => createState(),
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

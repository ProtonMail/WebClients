import { runSaga } from 'redux-saga';

import { HARD_LIMIT_EXCEEDED_CODE } from '../../constants/limits';
import type { DbApi } from '../../indexedDb/db';
import { LocalFlagsDb } from '../../indexedDb/localFlagsDb';
import { deleteConversation } from '../slices/core/conversations';
import { addResourceLimitError, clearMessageLimitReached, hydrateMessageLimitReached } from '../slices/meta/errors';
import {
    loadMessageLimitReached,
    persistAllMessageLimitsCleared,
    persistMessageLimitCleared,
    persistMessageLimitReached,
} from './messageLimit';

const run = async (saga: (...args: any[]) => any, localFlags: LocalFlagsDb, ...args: any[]) => {
    const dispatched: unknown[] = [];
    await runSaga(
        { context: { dbApi: { localFlags } as unknown as DbApi }, dispatch: (action) => dispatched.push(action) },
        saga,
        ...args
    ).toPromise();
    return dispatched;
};

const conversationFull = (conversationId: string) =>
    addResourceLimitError({ resource: 'messages', limit: 250, conversationId, code: HARD_LIMIT_EXCEEDED_CODE });

describe('messageLimit sagas', () => {
    it('persists server message-limit rejections and hydrates them on load', async () => {
        await run(persistMessageLimitReached, new LocalFlagsDb('saga-user-persist'), conversationFull('conv-1'));

        const dispatched = await run(loadMessageLimitReached, new LocalFlagsDb('saga-user-persist'));
        expect(dispatched).toEqual([hydrateMessageLimitReached(['conv-1'])]);
    });

    it('does not persist other 422s, other resources or errors without a conversation', async () => {
        const localFlags = new LocalFlagsDb('saga-user-ignore');
        await run(
            persistMessageLimitReached,
            localFlags,
            addResourceLimitError({ resource: 'messages', limit: 250, conversationId: 'conv-1', code: 2001 })
        );
        await run(
            persistMessageLimitReached,
            localFlags,
            addResourceLimitError({
                resource: 'assets',
                limit: 100,
                conversationId: 'conv-1',
                code: HARD_LIMIT_EXCEEDED_CODE,
            })
        );
        await run(
            persistMessageLimitReached,
            localFlags,
            addResourceLimitError({ resource: 'messages', limit: 250, code: HARD_LIMIT_EXCEEDED_CODE })
        );

        expect(await localFlags.getMessageLimitReachedConversationIds()).toEqual([]);
    });

    it('removes the persisted lock when unlocked or when the conversation is deleted', async () => {
        const localFlags = new LocalFlagsDb('saga-user-clear');
        await localFlags.markMessageLimitReached('conv-1');
        await localFlags.markMessageLimitReached('conv-2');
        await run(persistMessageLimitCleared, localFlags, clearMessageLimitReached('conv-1'));
        await run(persistMessageLimitCleared, localFlags, deleteConversation('conv-2'));

        expect(await run(loadMessageLimitReached, localFlags)).toEqual([]);
    });

    it('removes every persisted lock when all spaces are deleted', async () => {
        const localFlags = new LocalFlagsDb('saga-user-clear-all');
        await localFlags.markMessageLimitReached('conv-1');
        await localFlags.markMessageLimitReached('conv-2');
        await run(persistAllMessageLimitsCleared, localFlags);

        expect(await localFlags.getMessageLimitReachedConversationIds()).toEqual([]);
    });
});

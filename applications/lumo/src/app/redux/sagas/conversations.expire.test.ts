import type { UnknownAction } from '@reduxjs/toolkit';
import { subDays } from 'date-fns';
import { runSaga } from 'redux-saga';

import { FREE_USER_CHAT_DELETION_GRACE_DAYS, FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { Conversation, Space } from '../../types';
import { ConversationStatus } from '../../types';
import { locallyDeleteConversationFromLocalRequest } from '../slices/core/conversations';
import { locallyDeleteSpaceFromLocalRequest } from '../slices/core/spaces';
import type { LumoState } from '../store';
import { expireConversations } from './conversations';

const createConversation = (daysAgo: number, id: string, spaceId: string): Conversation => {
    const createdAt = subDays(new Date(), daysAgo).toISOString();

    return {
        id,
        spaceId,
        title: `Conversation ${id}`,
        createdAt,
        updatedAt: createdAt,
        starred: false,
        status: ConversationStatus.COMPLETED,
    };
};

const createState = ({
    conversations = {},
    spaces = {},
    isGhostChatMode = false,
}: {
    conversations?: LumoState['conversations'];
    spaces?: LumoState['spaces'];
    isGhostChatMode?: boolean;
} = {}): LumoState =>
    ({
        conversations,
        spaces,
        ghostChat: { isGhostChatMode },
    }) as LumoState;

const runExpireConversations = async (state: LumoState, hasLumoPlus: boolean) => {
    const dispatched: UnknownAction[] = [];

    await runSaga(
        {
            dispatch: (action: UnknownAction) => {
                dispatched.push(action);
            },
            getState: () => state,
        },
        expireConversations,
        { payload: { hasLumoPlus } }
    ).toPromise();

    return dispatched;
};

describe('expireConversations saga', () => {
    it('does nothing for Lumo Plus users', async () => {
        const eligible = createConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'eligible',
            'space-1'
        );
        const state = createState({
            conversations: { [eligible.id]: eligible },
            spaces: { 'space-1': { id: 'space-1', isProject: false } as Space },
        });

        await expect(runExpireConversations(state, true)).resolves.toEqual([]);
    });

    it('does nothing when ghost chat mode is enabled', async () => {
        const eligible = createConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'eligible',
            'space-1'
        );
        const state = createState({
            conversations: { [eligible.id]: eligible },
            spaces: { 'space-1': { id: 'space-1', isProject: false } as Space },
            isGhostChatMode: true,
        });

        await expect(runExpireConversations(state, false)).resolves.toEqual([]);
    });

    it('does not delete conversations still within the retention window', async () => {
        const recent = createConversation(3, 'recent', 'space-1');
        const state = createState({
            conversations: { [recent.id]: recent },
            spaces: { 'space-1': { id: 'space-1', isProject: false } as Space },
        });

        await expect(runExpireConversations(state, false)).resolves.toEqual([]);
    });

    it('soft deletes an eligible conversation in a project space without deleting the space', async () => {
        const eligible = createConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'eligible',
            'project-space'
        );
        const state = createState({
            conversations: { [eligible.id]: eligible },
            spaces: { 'project-space': { id: 'project-space', isProject: true } as Space },
        });

        const dispatched = await runExpireConversations(state, false);

        expect(dispatched).toEqual([locallyDeleteConversationFromLocalRequest('eligible')]);
    });

    it('soft deletes the whole space for an eligible legacy 1:1 chat', async () => {
        const eligible = createConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'eligible',
            'space-1'
        );
        const state = createState({
            conversations: { [eligible.id]: eligible },
            spaces: { 'space-1': { id: 'space-1', isProject: false } as Space },
        });

        const dispatched = await runExpireConversations(state, false);

        expect(dispatched).toEqual([locallyDeleteSpaceFromLocalRequest('space-1')]);
    });

    it('skips ghost conversations even when they are past the deletion threshold', async () => {
        const eligibleGhost = {
            ...createConversation(
                FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
                'ghost-eligible',
                'space-1'
            ),
            ghost: true,
        };
        const state = createState({
            conversations: { [eligibleGhost.id]: eligibleGhost },
            spaces: { 'space-1': { id: 'space-1', isProject: false } as Space },
        });

        await expect(runExpireConversations(state, false)).resolves.toEqual([]);
    });

    it('deletes only eligible conversations and leaves recent ones untouched', async () => {
        const recent = createConversation(2, 'recent', 'space-1');
        const eligible = createConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'eligible',
            'space-2'
        );
        const state = createState({
            conversations: {
                [recent.id]: recent,
                [eligible.id]: eligible,
            },
            spaces: {
                'space-1': { id: 'space-1', isProject: false } as Space,
                'space-2': { id: 'space-2', isProject: false } as Space,
            },
        });

        const dispatched = await runExpireConversations(state, false);

        expect(dispatched).toEqual([locallyDeleteSpaceFromLocalRequest('space-2')]);
    });
});

import { runSaga } from 'redux-saga';

import * as inviteRequests from '@proton/pass/lib/invites/invite.requests';
import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import { createTestShare } from '@proton/pass/lib/shares/share.test.utils';
import type { EventProcessor } from '@proton/pass/lib/sync/types';
import { getShareAccessOptions, syncInvites } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import type {
    GroupInvite,
    SyncEventChangedWithTokenOutput,
    SyncEventShareOutput,
    UserInvite,
} from '@proton/pass/types';
import { InviteType, ShareType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import {
    processGroupInvitesChanged,
    processInvitesChanged,
    processSharesWithInvitesToCreate,
} from './user-events.invites';

const resolveUserInvites = jest.spyOn(inviteRequests, 'resolveUserInvites');
const resolveGroupInvites = jest.spyOn(inviteRequests, 'resolveGroupInvites');
const event: SyncEventChangedWithTokenOutput = { EventToken: uniqueId() };

const run = async <A>(saga: (arg: A) => EventProcessor, arg: A, state?: any) => {
    const setup = sagaSetup(state);
    const result = await runSaga(setup.options, saga, arg).toPromise<boolean>();
    return { result, dispatched: setup.dispatched };
};

beforeEach(() => jest.clearAllMocks());

describe('processInvitesChanged', () => {
    test('returns `true` without dispatching when there is no event', async () => {
        const { result, dispatched } = await run(processInvitesChanged, null);
        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });

    test('resolves user invites and dispatches `syncInvites`', async () => {
        const token = uniqueId();
        const invite = { token, type: InviteType.User } as UserInvite;
        resolveUserInvites.mockResolvedValue([invite]);
        const { result, dispatched } = await run(processInvitesChanged, event);
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(syncInvites({ type: InviteType.User, invites: { [token]: invite } }));
    });

    test('returns `false` when resolving fails', async () => {
        resolveUserInvites.mockRejectedValue(new Error());
        const { result } = await run(processInvitesChanged, event);
        expect(result).toBe(false);
    });
});

describe('processGroupInvitesChanged', () => {
    test('resolves and partitions group invites into owner and org', async () => {
        const owner = { token: 'o1', type: InviteType.GroupOwner } as GroupInvite;
        const org = { token: 'g1', type: InviteType.GroupOrg } as GroupInvite;
        resolveGroupInvites.mockResolvedValue([owner, org]);
        const { result, dispatched } = await run(processGroupInvitesChanged, event);
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(syncInvites({ type: InviteType.GroupOwner, invites: { o1: owner } }));
        expect(dispatched).toContainEqual(syncInvites({ type: InviteType.GroupOrg, invites: { g1: org } }));
    });
});

describe('processSharesWithInvitesToCreate', () => {
    test('returns `true` without dispatching for an empty list', async () => {
        const { result, dispatched } = await run(processSharesWithInvitesToCreate, []);
        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });

    test('requests access options for a vault share', async () => {
        const state = { shares: { s1: createTestShare({ shareId: 's1', targetType: ShareType.Vault }) } };
        const event = { ShareID: 's1' } as SyncEventShareOutput;
        const { dispatched } = await run(processSharesWithInvitesToCreate, [event], state);
        expect(dispatched).toContainEqual(getShareAccessOptions.intent({ shareId: 's1' }));
    });

    test('requests access options for an item share with its item', async () => {
        const item = createTestItem('login', { itemId: 'i1', shareId: 's1' });
        const event = { ShareID: 's1' } as SyncEventShareOutput;
        const shares = { s1: createTestShare({ shareId: 's1', targetType: ShareType.Item }) };
        const items = { byShareId: { s1: { i1: item } } };
        const state = { shares, items };
        const { dispatched } = await run(processSharesWithInvitesToCreate, [event], state);
        expect(dispatched).toContainEqual(getShareAccessOptions.intent({ shareId: 's1', itemId: 'i1' }));
    });
});

import { runSaga } from 'redux-saga';

import { getShareAccessOptions, syncInvites } from '../../../store/actions';
import { sagaSetup } from '../../../store/sagas/testing';
import type { GroupInvite, SyncEventChangedWithTokenOutput, SyncEventShareOutput, UserInvite } from '../../../types';
import { InviteType, ShareType } from '../../../types';
import { uniqueId } from '../../../utils/string/unique-id';
import * as inviteRequests from '../../invites/invite.requests';
import { createTestItem } from '../../items/item.test.utils';
import { createTestShare } from '../../shares/share.test.utils';
import type { EventProcessor } from '../types';
import {
    processGroupInvitesChanged,
    processInvitesChanged,
    processSharesWithInvitesToCreate,
} from './user-events.invites';

jest.mock('@proton/pass/lib/invites/invite.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/invites/invite.requests'),
    resolveUserInvites: jest.fn(),
    resolveGroupInvites: jest.fn(),
}));

const resolveUserInvites = jest.mocked(inviteRequests.resolveUserInvites);
const resolveGroupInvites = jest.mocked(inviteRequests.resolveGroupInvites);
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

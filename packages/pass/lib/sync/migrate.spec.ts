import { runSaga } from 'redux-saga';

import { setUserAccess, syncMigration } from '../../store/actions';
import { type HydratedAccessState, default as rootReducer } from '../../store/reducers';
import { sagaReturn, sagaSetup } from '../../store/sagas/testing';
import type { RootSagaOptions, State } from '../../store/types';
import type { Maybe } from '../../types';
import { type PassEventListResponse, PlanType } from '../../types';
import * as inviteRequests from '../invites/invite.requests';
import * as organizationRequests from '../organization/organization.requests';
import * as shareRequests from '../shares/share.requests';
import { createTestShare } from '../shares/share.test.utils';
import * as userRequests from '../user/user.requests';
import { migrate } from './migrate';
import type { SyncResult } from './types';
import { SyncStrategy } from './types';
import * as v1Sync from './v1/sync';
import * as userEventRequests from './v2/user-events.requests';

jest.mock('@proton/pass/lib/invites/invite.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/invites/invite.requests'),
    getUserInvites: jest.fn(),
    getGroupInvites: jest.fn(),
}));
jest.mock('@proton/pass/lib/organization/organization.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/organization/organization.requests'),
    getOrganizationForPlan: jest.fn(),
}));
jest.mock('@proton/pass/lib/shares/share.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/shares/share.requests'),
    getShares: jest.fn(),
    getShareEvents: jest.fn(),
}));
jest.mock('@proton/pass/lib/sync/v1/sync', () => ({
    ...jest.requireActual('@proton/pass/lib/sync/v1/sync'),
    syncV1: jest.fn(),
}));
jest.mock('@proton/pass/lib/sync/v2/user-events.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/sync/v2/user-events.requests'),
    getUserEventLatestID: jest.fn(),
}));
jest.mock('@proton/pass/lib/user/user.requests', () => ({
    ...jest.requireActual('@proton/pass/lib/user/user.requests'),
    getUserAccess: jest.fn(),
}));

const getUserEventLatestID = jest.mocked(userEventRequests.getUserEventLatestID);
const getUserAccess = jest.mocked(userRequests.getUserAccess);
const getOrganizationForPlan = jest.mocked(organizationRequests.getOrganizationForPlan);
const getShares = jest.mocked(shareRequests.getShares);
const getUserInvites = jest.mocked(inviteRequests.getUserInvites);
const syncV1 = jest.mocked(v1Sync.syncV1);
const getShareEvents = jest.mocked(shareRequests.getShareEvents);
const getGroupInvites = jest.mocked(inviteRequests.getGroupInvites);

const access = { plan: { Type: PlanType.FREE } } as HydratedAccessState;
const v1Result = { v: 1 } as v1Sync.SyncResultV1;
const migrateAction = syncMigration({ userEventId: 'evt-1', strategy: SyncStrategy.USER_EVENTS });

const shareEvents = (overrides?: Partial<PassEventListResponse>): PassEventListResponse =>
    ({
        LatestEventID: 'se-0',
        DeletedItemIDs: [],
        UpdatedItems: [],
        EventsPending: false,
        ...overrides,
    }) as PassEventListResponse;

const run = async (next: SyncStrategy, state?: Partial<State>) => {
    const setup = sagaSetup({ ...rootReducer(undefined, { type: '__INIT__' }), ...state });
    const result = await runSaga(setup.options, migrate, next, {} as RootSagaOptions).toPromise<Maybe<SyncResult>>();
    return { result, dispatched: setup.dispatched };
};

beforeEach(() => {
    jest.clearAllMocks();
    getUserEventLatestID.mockResolvedValue('evt-1');
    getUserAccess.mockResolvedValue(access);
    getOrganizationForPlan.mockResolvedValue(null);
    getShares.mockResolvedValue([]);
    getShareEvents.mockResolvedValue(shareEvents());
    getUserInvites.mockResolvedValue({ Invites: [], Code: 1000 });
    getGroupInvites.mockResolvedValue({ Invites: { Invites: [], Total: 0 }, Code: 1000 });
    syncV1.mockImplementation(sagaReturn(v1Result));
});

describe('migrate', () => {
    test('commits the strategy switch and cursor when migrating to `USER_EVENTS`', async () => {
        const { result, dispatched } = await run(SyncStrategy.USER_EVENTS);
        expect(result).toBeUndefined();
        expect(dispatched).toContainEqual(setUserAccess(access));
        expect(dispatched).toContainEqual(migrateAction);
    });

    test('does not commit the strategy when a drain step fails', async () => {
        getShares.mockRejectedValue(new Error());
        const { dispatched } = await run(SyncStrategy.USER_EVENTS);
        expect(dispatched).not.toContainEqual(migrateAction);
    });

    test('rollbacks & clears cursor when migrating to `LEGACY`', async () => {
        const { result, dispatched } = await run(SyncStrategy.LEGACY);
        expect(syncV1).toHaveBeenCalled();
        expect(result).toBe(v1Result);
        expect(dispatched).toContainEqual(syncMigration({ userEventId: null, strategy: SyncStrategy.LEGACY }));
    });

    test('anchors the cursor before draining each channel', async () => {
        await run(SyncStrategy.USER_EVENTS, { shares: { s1: createTestShare({ shareId: 's1', eventId: 'se-0' }) } });
        expect(getShareEvents).toHaveBeenCalledWith('s1', 'se-0');
        expect(getShares).toHaveBeenCalled();
        expect(getUserInvites).toHaveBeenCalled();
        expect(getGroupInvites).not.toHaveBeenCalled(); /** non-B2B state */

        /** Assert `getUserEventLatestID` is ALWAYS called first */
        const getUserEventLatestIDCallOrder = getUserEventLatestID.mock.invocationCallOrder[0];
        [getUserAccess, getOrganizationForPlan, getShares, getShareEvents, getUserInvites].forEach((fn) => {
            const fnCallOrder = fn.mock.invocationCallOrder[0];
            expect(getUserEventLatestIDCallOrder).toBeLessThan(fnCallOrder);
        });
    });

    test('drains share events recursively until none are pending', async () => {
        getShareEvents
            .mockResolvedValueOnce(shareEvents({ LatestEventID: 'se-1', EventsPending: true }))
            .mockResolvedValueOnce(shareEvents({ LatestEventID: 'se-2', EventsPending: false }));

        await run(SyncStrategy.USER_EVENTS, { shares: { s1: createTestShare({ shareId: 's1', eventId: 'se-0' }) } });
        expect(getShareEvents).toHaveBeenNthCalledWith(1, 's1', 'se-0');
        expect(getShareEvents).toHaveBeenNthCalledWith(2, 's1', 'se-1');
        expect(getShareEvents).toHaveBeenCalledTimes(2);
    });
});

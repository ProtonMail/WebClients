import { all, call, put, select } from 'redux-saga/effects';

import { isShareRemovedError } from '@proton/pass/lib/api/errors';
import { setSyncStrategy } from '@proton/pass/lib/events/global';
import { SyncStrategy } from '@proton/pass/lib/events/types';
import type { GroupInvitesGetResponse } from '@proton/pass/lib/events/v1/invite-polling.processor';
import {
    processGroupInvitePollingEvent,
    processUserInvitePollingEvent,
} from '@proton/pass/lib/events/v1/invite-polling.processor';
import {
    processSharePollingError,
    processSharePollingEvent,
    processSharesIncomingEvent,
    processSharesPollingEvent,
} from '@proton/pass/lib/events/v1/share-polling.processor';
import { getUserEventLatestID } from '@proton/pass/lib/events/v2/user-events.requests';
import { getGroupInvites, getUserInvites } from '@proton/pass/lib/invites/invite.requests';
import { getShareEvents, getShareLatestEventId, getShares } from '@proton/pass/lib/shares/share.requests';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { commitSyncStrategy, setUserAccess, setUserEventID } from '@proton/pass/store/actions';
import type { HydratedAccessState } from '@proton/pass/store/reducers';
import type { SharesState } from '@proton/pass/store/reducers/shares';
import { selectAllShares, selectShareState } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { InvitesGetResponse, PassEventListResponse, ShareGetResponse } from '@proton/pass/types';
import type { Share } from '@proton/pass/types/data/shares';

export function* drainShareEvents(share: Share, options: RootSagaOptions, nextEventID?: string): Generator {
    const { shareId } = share;

    try {
        const eventId: string = nextEventID ?? share.eventId ?? (yield call(getShareLatestEventId, shareId));
        const Events: PassEventListResponse = yield call(getShareEvents, shareId, eventId);
        yield call(processSharePollingEvent, shareId, { Events }, options);
        if (Events.EventsPending) yield call(drainShareEvents, share, options, Events.LatestEventID);
    } catch (err) {
        if (isShareRemovedError(err)) yield call(processSharePollingError, shareId);
    }
}

export function* drainShares() {
    const shares: ShareGetResponse[] = yield call(getShares);
    const localShares: SharesState = yield select(selectShareState);

    yield call(processSharesPollingEvent, shares, localShares);

    const newShares = shares.filter((share) => !(share.ShareID in localShares));
    if (newShares.length) yield call(processSharesIncomingEvent, newShares);
}

export function* drainInvites() {
    const userInvites: InvitesGetResponse = yield call(getUserInvites);
    const groupInvites: GroupInvitesGetResponse = yield call(getGroupInvites);

    yield call(processUserInvitePollingEvent, userInvites);
    yield call(processGroupInvitePollingEvent, groupInvites);
}

export function* updateSyncStrategy(strategy: SyncStrategy) {
    setSyncStrategy(strategy);
    yield put(commitSyncStrategy(strategy));
}

/** V1 → V2 migration. Runs at boot-time during hydration, before polling
 * starts. No mid-session transitions — if the feature flag changes while
 * the app is running, it takes effect on next boot.
 *
 * Sequence:
 * 1. Anchor the V2 cursor at the server's current state. This MUST happen
 *    before draining so that V2 polling will cover any events that occur
 *    during the drain window. The drain processes V1 events up to this
 *    point, and V2 continues from here — no gap, no overlap.
 * 2. Revalidate user-access (may have changed while V1 was active).
 * 3. Drain all V1 channels imperatively:
 *    a. Per-share events (parallel across all shares, recursive until no
 *       `EventsPending`)
 *    b. Shares list (detect metadata changes + newly created shares)
 *    c. Invites (user + group)
 * 4. Commit the strategy switch + store the V2 event cursor.
 *
 * If any step throws, the caller should keep the old strategy and retry
 * on next boot. */
export function* migrateV2(options: RootSagaOptions) {
    /** 1. Anchor V2 event cursor at current server state */
    const userEventID: string = yield call(getUserEventLatestID);

    /** 2. Revalidate user-access */
    const userAccess: HydratedAccessState = yield call(getUserAccess);
    yield put(setUserAccess(userAccess));

    /** 3. Drain all V1 polling channels */
    /** 3a. Drain per-share events in parallel */
    const shares = (yield select(selectAllShares)) as Share[];
    yield all(shares.map((share) => call(drainShareEvents, share, options)));
    /** 3b. Drain shares list (metadata changes + new shares) */
    yield call(drainShares);
    /** 3c. Drain invites (user + group) */
    yield call(drainInvites);

    /** 4. Commit strategy switch + V2 cursor */
    yield call(updateSyncStrategy, SyncStrategy.USER_EVENTS);
    yield put(setUserEventID(userEventID));
}

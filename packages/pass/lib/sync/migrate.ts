import { all, call, put, select } from 'redux-saga/effects';

import { isShareRemovedError } from '@proton/pass/lib/api/errors';
import { getGroupInvites, getUserInvites } from '@proton/pass/lib/invites/invite.requests';
import { getOrganizationForPlan } from '@proton/pass/lib/organization/organization.requests';
import { getShareEvents, getShareLatestEventId, getShares } from '@proton/pass/lib/shares/share.requests';
import { setSyncStrategy } from '@proton/pass/lib/sync/global';
import { type SyncResult, SyncStrategy } from '@proton/pass/lib/sync/types';
import type { GroupInvitesGetResponse } from '@proton/pass/lib/sync/v1/invite-polling.processor';
import {
    processGroupInvitePollingEvent,
    processUserInvitePollingEvent,
} from '@proton/pass/lib/sync/v1/invite-polling.processor';
import {
    processSharePollingError,
    processSharePollingEvent,
    processSharesIncomingEvent,
    processSharesPollingEvent,
} from '@proton/pass/lib/sync/v1/share-polling.processor';
import { type SyncResultV1, syncV1 } from '@proton/pass/lib/sync/v1/sync';
import { getUserEventLatestID } from '@proton/pass/lib/sync/v2/user-events.requests';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { setUserAccess, syncMigration } from '@proton/pass/store/actions';
import { setOrganization } from '@proton/pass/store/actions/creators/organization';
import type { HydratedAccessState } from '@proton/pass/store/reducers';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { SharesState } from '@proton/pass/store/reducers/shares';
import { selectAllShares, selectShareState } from '@proton/pass/store/selectors';
import { selectLoadGroupInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { InvitesGetResponse, Maybe, MaybeNull, PassEventListResponse, ShareGetResponse } from '@proton/pass/types';
import type { Share } from '@proton/pass/types/data/shares';
import { logger } from '@proton/pass/utils/logger';

export function* drainShareEvents(share: Share, options: RootSagaOptions, nextEventID?: string): Generator {
    const { shareId } = share;

    try {
        const eventId: string = nextEventID ?? share.eventId ?? (yield call(getShareLatestEventId, shareId));
        const Events: PassEventListResponse = yield call(getShareEvents, shareId, eventId);
        yield call(processSharePollingEvent, shareId, { Events }, options);
        if (Events.EventsPending) yield call(drainShareEvents, share, options, Events.LatestEventID);
    } catch (err) {
        if (!isShareRemovedError(err)) throw err;
        yield call(processSharePollingError, shareId);
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
    yield call(processUserInvitePollingEvent, userInvites);

    if ((yield select(selectLoadGroupInvites)) as boolean) {
        const groupInvites: GroupInvitesGetResponse = yield call(getGroupInvites);
        yield call(processGroupInvitePollingEvent, groupInvites);
    }
}

export function* updateSyncStrategy(strategy: SyncStrategy, userEventId: MaybeNull<string>) {
    setSyncStrategy(strategy);
    yield put(syncMigration({ userEventId, strategy }));
}

/** V1 → V2 migration. Runs at boot-time during hydration, before polling
 * starts. No mid-session transitions — if the feature flag changes while
 * the app is running, it takes effect on next boot.
 *
 * Sequence:
 * 1. Anchor the V2 cursor at the server's current state. This MUST happen
 *    before draining so that V2 polling will cover any events that occur
 *    during the drain window. The drain processes V1 events up to this
 *    point, and V2 continues from here.
 * 2. Revalidate user-access and organization state (may have changed while
 *    V1 was active). These writes commit immediately.
 * 3. Drain all V1 channels imperatively:
 *    a. Per-share events (parallel across all shares, recursive until no
 *       `EventsPending`)
 *    b. Shares list (detect metadata changes + newly created shares)
 *    c. Invites (user + group)
 * 4. Commit the strategy switch + store the V2 event cursor.
 *
 * Step 4 is the only atomic commit that flips the client to V2. If any step
 * throws before it, the strategy stays LEGACY and the migration retries on
 * next boot. Step-2 revalidations are harmless and re-run on the next attempt. */
export function* migrateV2(options: RootSagaOptions) {
    /** 1. Anchor V2 event cursor at current server state */
    const userEventId: string = yield call(getUserEventLatestID);

    /** 2a. Revalidate user-access state */
    const userAccess: HydratedAccessState = yield call(getUserAccess);
    yield put(setUserAccess(userAccess));
    /** 2b. Revalidate organization state (plan may have changed while V1 was active) */
    const organization: MaybeNull<OrganizationState> = yield call(getOrganizationForPlan, userAccess.plan);
    yield put(setOrganization(organization));

    /** 3a. Drain per-share events in parallel */
    const shares = (yield select(selectAllShares)) as Share[];
    yield all(shares.map((share) => call(drainShareEvents, share, options)));
    /** 3b. Drain shares list (metadata changes + new shares) */
    yield call(drainShares);
    /** 3c. Drain invites (user + group) */
    yield call(drainInvites);

    /** 4. Commit strategy switch + V2 cursor */
    yield call(updateSyncStrategy, SyncStrategy.USER_EVENTS, userEventId);
}

/** V2 → V1 rollback. Runs a full V1 sync and returns its result so the boot
 * sequence can apply it through `bootSuccess`. Reverts the strategy to `LEGACY`
 * with a null cursor. Boot-time only: if any step throws, the current strategy
 * is kept and the rollback retries on next boot. */
export function* rollbackV2(options: RootSagaOptions): Generator<unknown, SyncResultV1> {
    const result: SyncResultV1 = yield call(syncV1, options);
    yield call(updateSyncStrategy, SyncStrategy.LEGACY, null);
    return result;
}

/** Returns the rollback's `SyncResult` or applies the migrated state
 * incrementally and returns nothing when migrating to `USER_EVENTS`. */
export function* migrate(next: SyncStrategy, options: RootSagaOptions): Generator<unknown, Maybe<SyncResult>> {
    try {
        switch (next) {
            case SyncStrategy.LEGACY:
                return yield call(rollbackV2, options);
            case SyncStrategy.USER_EVENTS:
                yield call(migrateV2, options);
                return;
        }
    } catch (err) {
        logger.warn(`[SyncStrategy::migration] Migrating to ${next} failed`, err);
    }
}

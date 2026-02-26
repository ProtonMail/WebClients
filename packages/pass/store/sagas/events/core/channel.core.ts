import { all, call, fork, put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import type { EventCursor, EventManagerEvent } from '@proton/pass/lib/events/manager/manager';
import { SyncStrategy } from '@proton/pass/lib/events/types';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import {
    coreEvent,
    getInAppNotifications,
    getUserAccessIntent,
    getUserFeaturesIntent,
    syncIntent,
    userRefresh,
} from '@proton/pass/store/actions';
import { getGroup } from '@proton/pass/store/actions/creators/groups';
import { getOrganizationPauseList, getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import type { HydratedUserState } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import {
    selectAllAddresses,
    selectLatestEventId,
    selectSyncStrategy,
    selectUser,
    selectUserPlan,
    selectUserSettings,
} from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, CoreEvent, MaybeNull, PassPlanResponse } from '@proton/pass/types';
import { EventActions } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { notIn } from '@proton/pass/utils/fp/predicates';
import { logId, logger } from '@proton/pass/utils/logger';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import type { Address, User, UserSettings } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';

import { eventChannelFactory } from '../v1/channel.factory';
import { channelEvents, channelInitalize } from '../v1/channel.worker';
import type { EventChannel } from '../v1/types';

/** Hydrates crypto context whenever user or address keys may have changed.
 * Reads user and addresses from Redux (always up-to-date after userEvent dispatch).
 * Triggers a full sync if user keys changed to update share accessibility. */
export function* onUserRefreshed(eventUser?: User, keyPassword?: string) {
    try {
        if (!keyPassword) throw new Error('[UserRefresh] missing `keyPassword`');

        const user: MaybeNull<User> = eventUser ?? (yield select(selectUser));
        if (!user) throw new Error('[UserRefresh] no user');

        const localUserKeyIds = (PassCrypto.getContext().userKeys ?? []).map(prop('ID'));
        const activeUserKeys = user.Keys.filter(({ Active }) => Active === 1);
        const keysUpdated = activeUserKeys.length !== localUserKeyIds.length || activeUserKeys.some(({ ID }) => notIn(localUserKeyIds)(ID));

        /* Refresh addresses that may have changed (including address keys) */
        const addresses: Address[] = yield select(selectAllAddresses);
        yield PassCrypto.hydrate({ user, keyPassword, addresses, clear: false });

        if (keysUpdated) {
            /** Full sync removes shares we can no longer decrypt
             * and/or recovers newly accessible ones */
            logger.info(`[Polling::Core] Detected user keys update`);
            yield put(syncIntent());
        }
    } catch (err) {
        logger.warn(`[Polling::Core] User refresh failed`, err);
    }
}

function* onCoreEvent(
    event: EventManagerEvent<CoreEvent>,
    _: EventChannel<CoreEvent>,
    { getAuthStore, getTelemetry, onLocaleUpdated, extensionId }: RootSagaOptions
) {
    const telemetry = getTelemetry();
    if ('error' in event) throw event.error;

    const strategy: SyncStrategy = yield select(selectSyncStrategy);
    const legacySync = strategy === SyncStrategy.LEGACY;

    const currentEventId = (yield select(selectLatestEventId)) as MaybeNull<string>;
    const userId = getAuthStore().getUserID()!;
    const userSettings: MaybeNull<UserSettings> = yield select(selectUserSettings);
    const cachedUser: MaybeNull<User> = yield select(selectUser);
    const cachedPlan: MaybeNull<PassPlanResponse> = yield select(selectUserPlan);

    /* dispatch only if there was a change */
    if (currentEventId !== event.EventID) {
        yield put(coreEvent(event));
        logger.info(`[Polling::Core] event ${logId(event.EventID!)}`);
    }

    const keyPassword = getAuthStore().getPassword();

    if (event.Refresh) {
        const data: HydratedUserState = yield call(getUserData, extensionId);
        yield put(userRefresh(data));
        yield call(onUserRefreshed, data.user, keyPassword);
        return;
    }

    if (event.UserSettings && telemetry) {
        const { Telemetry } = event.UserSettings;
        if (Telemetry !== userSettings?.Telemetry) telemetry[Telemetry === 1 ? 'start' : 'stop']();
    }

    if (event.UserSettings?.Locale) {
        const { Locale } = event.UserSettings;
        if (Locale !== userSettings?.Locale) yield onLocaleUpdated?.(Locale);
    }

    if (event.GroupMembers) {
        const addresses: Address[] = yield select(selectAllAddresses);
        const ownAddressIds = new Set(addresses.map(({ ID }) => ID));

        for (const { Action, GroupMember } of event.GroupMembers ?? []) {
            if (Action !== EventActions.DELETE && ownAddressIds.has(GroupMember.AddressID)) {
                yield put(getGroup.intent(GroupMember.GroupID));
            }
        }
    }

    if (event.User || event.Addresses) yield call(onUserRefreshed, event.User, keyPassword);

    const planChanged =
        (event.User && event.User.Subscribed !== cachedUser?.Subscribed) ||
        (event.Organization && event.Organization.PlanName !== cachedPlan?.InternalName);

    /* Synchronize whenever polling for core user events:
     * · User access (revalidate on plan change)
     * · In-app Notification (revalidate on plan change)
     * · Feature flags
     * · Organization
     * These actions are throttled via `maxAge` metadata */
    yield put(getUserFeaturesIntent(userId));

    if (EXTENSION_BUILD) yield put(getOrganizationPauseList.intent());

    yield put(getOrganizationPauseList.intent());
    yield put((planChanged ? withRevalidate : identity)(getInAppNotifications.intent()));

    if (legacySync) {
        yield put((planChanged ? withRevalidate : identity)(getUserAccessIntent(userId)));
        yield put(getOrganizationSettings.intent());
    }
}

export const createCoreChannel = (api: Api, eventID: string) =>
    eventChannelFactory<CoreEvent>({
        api,
        channelId: 'user',
        initialEventID: eventID,
        query: getEvents,
        getCursor: ({ EventID, More }) => ({ EventID, More: Boolean(More) }),
        getLatestEventID: () => api<EventCursor>(getLatestID()).then(({ EventID }) => EventID),
        onEvent: onCoreEvent,
        onClose: () => logger.info(`[Polling::Core] closing channel`),
    });

export function* coreChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[Polling::Core] start polling for user events`);

    const eventID: string = ((yield select(selectLatestEventId)) as ReturnType<typeof selectLatestEventId>) ?? '';
    const channel = createCoreChannel(api, eventID);
    const events = fork(channelEvents<CoreEvent>, channel, options);
    const wakeup = fork(channelInitalize<CoreEvent>, channel, options);

    yield all([events, wakeup]);
}

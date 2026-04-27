import { all, call, fork, put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import type { EventCursor, EventManagerEvent } from '@proton/pass/lib/events/manager';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import {
    getInAppNotifications,
    getUserAccessIntent,
    getUserFeaturesIntent,
    syncIntent,
    userEvent,
    userRefresh,
} from '@proton/pass/store/actions';
import { getGroup } from '@proton/pass/store/actions/creators/groups';
import { getOrganizationPauseList, getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import type { HydratedUserState } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { SyncType } from '@proton/pass/store/sagas/client/sync';
import { selectAllAddresses, selectLatestEventId, selectUser, selectUserPlan, selectUserSettings } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, MaybeNull, PassPlanResponse, UserEvent } from '@proton/pass/types';
import { EventActions } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { notIn } from '@proton/pass/utils/fp/predicates';
import { logId, logger } from '@proton/pass/utils/logger';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import type { Address, User, UserSettings } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';

import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';
import type { EventChannel } from './types';

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
            logger.info(`[ServerEvents::User] Detected user keys update`);
            yield put(syncIntent(SyncType.FULL));
        }
    } catch (err) {
        logger.warn(`[ServerEvents::User] user refresh failed`, err);
    }
}

function* onUserEvent(
    event: EventManagerEvent<UserEvent>,
    _: EventChannel<UserEvent>,
    { getAuthStore, getTelemetry, onLocaleUpdated, extensionId }: RootSagaOptions
) {
    const telemetry = getTelemetry();
    if ('error' in event) throw event.error;

    const currentEventId = (yield select(selectLatestEventId)) as MaybeNull<string>;
    const userId = getAuthStore().getUserID()!;
    const userSettings: MaybeNull<UserSettings> = yield select(selectUserSettings);
    const cachedUser: MaybeNull<User> = yield select(selectUser);
    const cachedPlan: MaybeNull<PassPlanResponse> = yield select(selectUserPlan);

    /* dispatch only if there was a change */
    if (currentEventId !== event.EventID) {
        yield put(userEvent(event));
        logger.info(`[ServerEvents::User] event ${logId(event.EventID!)}`);
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
    yield put((planChanged ? withRevalidate : identity)(getUserAccessIntent(userId)));
    yield put((planChanged ? withRevalidate : identity)(getInAppNotifications.intent()));
    yield put(getUserFeaturesIntent(userId));
    yield put(getOrganizationSettings.intent());
    yield put(getOrganizationPauseList.intent());
    yield put(getInAppNotifications.intent());
}

export const createUserChannel = (api: Api, eventID: string) =>
    eventChannelFactory<UserEvent>({
        api,
        channelId: 'user',
        initialEventID: eventID,
        query: getEvents,
        getCursor: ({ EventID, More }) => ({ EventID, More: Boolean(More) }),
        getLatestEventID: () => api<EventCursor>(getLatestID()).then(({ EventID }) => EventID),
        onEvent: onUserEvent,
        onClose: () => logger.info(`[ServerEvents::User] closing channel`),
    });

export function* userChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[ServerEvents::User] start polling for user events`);

    const eventID: string = ((yield select(selectLatestEventId)) as ReturnType<typeof selectLatestEventId>) ?? '';
    const eventsChannel = createUserChannel(api, eventID);
    const events = fork(channelEvents<UserEvent>, eventsChannel, options);
    const wakeup = fork(channelInitalize<UserEvent>, eventsChannel, options);

    yield all([events, wakeup]);
}

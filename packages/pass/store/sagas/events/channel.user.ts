/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import type { EventCursor, EventManagerEvent } from '@proton/pass/lib/events/manager';
import { getUserAccessIntent, syncIntent, userEvent } from '@proton/pass/store/actions';
import { userAccessRequest } from '@proton/pass/store/actions/requests';
import { withRevalidate } from '@proton/pass/store/actions/with-request';
import { selectAllAddresses, selectLatestEventId, selectUserSettings } from '@proton/pass/store/selectors';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull, UserEvent } from '@proton/pass/types';
import { type Api } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { notIn } from '@proton/pass/utils/fp/predicates';
import { logId, logger } from '@proton/pass/utils/logger';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import type { Address, UserSettings } from '@proton/shared/lib/interfaces';

import { eventChannelFactory } from './channel.factory';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';
import type { EventChannel } from './types';

function* onUserEvent(
    event: EventManagerEvent<UserEvent>,
    _: EventChannel<UserEvent>,
    { getAuthStore, getTelemetry }: WorkerRootSagaOptions
) {
    const telemetry = getTelemetry();
    if ('error' in event) throw event.error;

    const currentEventId = (yield select(selectLatestEventId)) as MaybeNull<string>;

    /* dispatch only if there was a change */
    if (currentEventId !== event.EventID) yield put(userEvent(event));

    logger.info(`[ServerEvents::User] event ${logId(event.EventID!)}`);
    const { User: user } = event;

    if (event.UserSettings && telemetry) {
        const { Telemetry } = event.UserSettings;
        const userSettings: MaybeNull<UserSettings> = yield select(selectUserSettings);
        if (Telemetry !== userSettings?.Telemetry) telemetry[Telemetry === 1 ? 'start' : 'stop']();
    }

    /* if the subscription/invoice changes, refetch the user Plan */
    if (event.Subscription || event.Invoices) {
        const getPlanAction = withRevalidate(getUserAccessIntent(userAccessRequest(getAuthStore().getUserID()!)));
        yield put(getPlanAction);
    }

    /* if we get the user model from the event, check if
     * any new active user keys are available. We might be
     * dealing with a user re-activating a disabled user key
     * in which case we want to trigger a full data sync in
     * order to access any previously inactive shares */
    if (user) {
        const localUserKeyIds = (PassCrypto.getContext().userKeys ?? []).map(prop('ID'));
        const activeUserKeys = user.Keys.filter(({ Active }) => Active === 1);

        const keysUpdated =
            activeUserKeys.length !== localUserKeyIds.length ||
            activeUserKeys.some(({ ID }) => notIn(localUserKeyIds)(ID));

        if (keysUpdated) {
            logger.info(`[Saga::Events] Detected user keys update`);
            const keyPassword = getAuthStore().getPassword();
            const addresses = (yield select(selectAllAddresses)) as Address[];
            yield PassCrypto.hydrate({ user, keyPassword, addresses });
            yield put(syncIntent()); /* trigger a full data sync */
        }
    }
}

export const createUserChannel = (api: Api, eventID: string) =>
    eventChannelFactory<UserEvent>({
        api,
        interval: ACTIVE_POLLING_TIMEOUT,
        initialEventID: eventID,
        query: getEvents,
        getCursor: ({ EventID, More }) => ({ EventID, More: Boolean(More) }),
        getLatestEventID: () => api<EventCursor>(getLatestID()).then(({ EventID }) => EventID),
        onEvent: onUserEvent,
        onClose: () => logger.info(`[Saga::UserChannel] closing channel`),
    });

export function* userChannel(api: Api, options: WorkerRootSagaOptions) {
    logger.info(`[Saga::UserChannel] start polling for user events`);

    const eventID: string = ((yield select(selectLatestEventId)) as ReturnType<typeof selectLatestEventId>) ?? '';
    const eventsChannel = createUserChannel(api, eventID);
    const events = fork(channelEventsWorker<UserEvent>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<UserEvent>, eventsChannel);

    yield all([events, wakeup]);
}

/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/crypto';
import type { UserEvent } from '@proton/pass/types';
import { type Api } from '@proton/pass/types';
import { notIn, prop } from '@proton/pass/utils/fp';
import { logId, logger } from '@proton/pass/utils/logger';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import type { EventCursor, EventManagerEvent } from '../../../events/manager';
import { setUserPlan, syncIntent, userEvent } from '../../actions';
import type { UserPlanState } from '../../reducers';
import { selectAllAddresses, selectLatestEventId } from '../../selectors/user';
import type { State, WorkerRootSagaOptions } from '../../types';
import { getUserPlan } from '../workers/user';
import { eventChannelFactory } from './channel.factory';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';
import type { EventChannel } from './types';

function* onUserEvent(
    event: EventManagerEvent<UserEvent>,
    _: EventChannel<UserEvent>,
    { getAuth }: WorkerRootSagaOptions
) {
    if ('error' in event) throw event.error;

    yield put(userEvent(event));

    logger.info(`[ServerEvents::User] event ${logId(event.EventID!)}`);
    const { User: user } = event;

    /* if the subscription/invoice changes, refetch the user Plan */
    if (event.Subscription || event.Invoices) {
        yield fork(function* () {
            const { user } = (yield select()) as State;
            const plan = (yield getUserPlan(user, { force: true })) as UserPlanState;
            yield put(setUserPlan(plan));
        });
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
            const keyPassword = getAuth().getPassword();
            const addresses = (yield select(selectAllAddresses)) as Address[];
            yield PassCrypto.hydrate({ user, keyPassword, addresses });
            yield put(syncIntent({})); /* trigger a full data sync */
        }
    }
}

export const createUserChannel = (api: Api, eventID: string) =>
    eventChannelFactory<UserEvent>({
        api,
        interval: INTERVAL_EVENT_TIMER,
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

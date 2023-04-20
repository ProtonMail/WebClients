/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, fork, select } from 'redux-saga/effects';

import type { Api, ServerEvent } from '@proton/pass/types';
import { ChannelType } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';
import { getLatestID } from '@proton/shared/lib/api/events';
import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';

import { selectLatestEventId } from '../../selectors/user';
import type { WorkerRootSagaOptions } from '../../types';
import { eventChannelFactory } from './channel.factory';
import { channelEventsWorker, channelWakeupWorker } from './channel.worker';

function* onUserEvent(event: ServerEvent<ChannelType.USER>) {
    if (event.error) throw event.error;
    logger.info(`[ServerEvents::User] event ${logId(event.EventID!)}`);
}

export const createUserChannel = (api: Api, eventID: string) =>
    eventChannelFactory<ChannelType.USER>({
        api,
        interval: INTERVAL_EVENT_TIMER,
        type: ChannelType.USER,
        eventID,
        onEvent: onUserEvent,
        onClose: () => logger.info(`[Saga::UserChannel] closing channel`),
    });

export function* userChannel(api: Api, options: WorkerRootSagaOptions) {
    logger.info(`[Saga::UserChannel] start polling for user events`);

    const eventID =
        ((yield select(selectLatestEventId)) as ReturnType<typeof selectLatestEventId>) ??
        ((yield api(getLatestID())) as { EventID: string }).EventID;

    const eventsChannel = createUserChannel(api, eventID);
    const events = fork(channelEventsWorker<ChannelType.USER>, eventsChannel, options);
    const wakeup = fork(channelWakeupWorker<ChannelType.USER>, eventsChannel);

    yield all([events, wakeup]);
}

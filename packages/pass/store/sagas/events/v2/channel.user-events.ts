import { call, cancelled, delay, put, select } from 'redux-saga/effects';

import { processUserEvents } from '@proton/pass/lib/events/v2/user-events.processor';
import { getUserEventsSince } from '@proton/pass/lib/events/v2/user-events.requests';
import { setUserEventID } from '@proton/pass/store/actions';
import { selectLatestUserEventId } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, Id, MaybeNull, SyncEventListOutput } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

const CHANNEL_ID = 'Polling::UserEventsV2';

export function* userEventsChannel(_: Api, options: RootSagaOptions): Generator {
    try {
        while (true) {
            /** 1. Ensure valid `userEventID` */
            const lastUserEventID: MaybeNull<Id> = yield select(selectLatestUserEventId);

            if (!lastUserEventID) {
                logger.warn(`[${CHANNEL_ID}] No userEventID, skipping poll`);
                yield delay(options.getPollingInterval());
                continue;
            }

            /** 2. Fetch events since `userEventID` */
            logger.debug(`[${CHANNEL_ID}] Polling events since ${logId(lastUserEventID)}`);
            const events: SyncEventListOutput = yield call(getUserEventsSince, lastUserEventID);

            /** 3. Process user events */
            logger.debug(`[${CHANNEL_ID}] Processing events up to ${logId(events.LastEventID)} `);
            const processed: boolean = yield call(processUserEvents, events, options);

            /** 4. Update state with new eventID only if all events were processed */
            if (processed) yield put(setUserEventID(events.LastEventID));

            /** 5. If more events pending -> poll immediately */
            if (processed && events.EventsPending) continue;

            /** 6. Wait for next poll interval */
            yield delay(options.getPollingInterval());
        }
    } catch {
    } finally {
        if (yield cancelled()) logger.info(`[${CHANNEL_ID}] Channel cancelled`);
    }
}

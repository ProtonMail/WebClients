import { call, cancelled, delay, put, race, select, take } from 'redux-saga/effects';

import { processUserEvents } from '../../../../lib/sync/v2/user-events.processor';
import { getUserEventsSince } from '../../../../lib/sync/v2/user-events.requests';
import type { Api, Id, MaybeNull, SyncEventListOutput } from '../../../../types';
import { logId, logger } from '../../../../utils/logger';
import { setUserEventID } from '../../../actions';
import { forcePollV2 } from '../../../actions/creators/polling';
import { selectLatestUserEventId } from '../../../selectors';
import type { RootSagaOptions } from '../../../types';

const CHANNEL_ID = 'Polling::UserEventsV2';

export function* userEventsChannel(_: Api, options: RootSagaOptions): Generator {
    try {
        while (true) {
            try {
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
                if (processed && !events.FullRefresh) yield put(setUserEventID(events.LastEventID));

                /** 5. If more events pending -> poll immediately */
                if (processed && events.EventsPending) continue;
            } catch (err) {
                logger.warn(`[${CHANNEL_ID}] Channel error`, err);
            }

            /** 6. Wait for next poll interval. `forcePollV2` short-circuits
             * the delay to trigger an immediate re-poll. If a poll is already
             * in-flight the action is naturally ignored — the ongoing poll
             * will pick up the latest events anyway. */
            yield race({
                delay: delay(options.getPollingInterval()),
                force: take(forcePollV2.match),
            });
        }
    } finally {
        if (yield cancelled()) logger.info(`[${CHANNEL_ID}] Channel cancelled`);
    }
}

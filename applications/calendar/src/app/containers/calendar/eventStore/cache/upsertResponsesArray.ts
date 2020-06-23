import { API_CODES } from 'proton-shared/lib/constants';
import upsertCalendarApiEvent from './upsertCalendarApiEvent';
import { getIsDeleteSyncOperation, SyncEventActionOperations } from '../../getSyncMultipleEventsPayload';
import { SyncMultipleApiResponse, SyncMultipleApiResponses } from '../../../../interfaces/Import';
import { CalendarsEventsCache } from '../interface';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';

const getResponse = (responses: SyncMultipleApiResponses[], index: number) => {
    return responses.find((x) => x.Index === index);
};

const upsertMultiActionsResponses = (
    multiActions: SyncEventActionOperations[],
    multiResponses: SyncMultipleApiResponse[],
    calendarsEventsCache: CalendarsEventsCache
) => {
    for (let i = 0; i < multiActions.length; ++i) {
        const actions = multiActions[i];
        const responses = multiResponses[i];

        const responsesArray = responses?.Responses;
        const calendarEventCache = calendarsEventsCache.calendars[actions.calendarID];

        if (!Array.isArray(responsesArray)) {
            continue;
        }

        for (let j = 0; j < actions.operations.length; ++j) {
            const operation = actions.operations[j];
            const matchingResponse = getResponse(responsesArray, j);

            if (getIsDeleteSyncOperation(operation)) {
                if (!matchingResponse || matchingResponse.Response.Code === API_CODES.SINGLE_SUCCESS) {
                    removeCalendarEventStoreRecord(operation.data.Event.ID, calendarEventCache);
                }
                continue;
            }

            if (matchingResponse) {
                const matchingEvent = matchingResponse.Response.Event;
                if (matchingEvent && matchingResponse.Response.Code === API_CODES.SINGLE_SUCCESS) {
                    upsertCalendarApiEvent(matchingEvent, calendarEventCache);
                }
            }
        }
    }
};

export default upsertMultiActionsResponses;

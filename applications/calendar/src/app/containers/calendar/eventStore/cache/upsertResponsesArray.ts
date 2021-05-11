import { API_CODES } from 'proton-shared/lib/constants';
import {
    SyncMultipleApiResponse,
    SyncMultipleApiResponses,
    UpdateEventPartApiResponse,
} from 'proton-shared/lib/interfaces/calendar';
import { UpdatePartstatOperation, UpdatePersonalPartOperation } from '../../../../interfaces/Invite';
import upsertCalendarApiEvent from './upsertCalendarApiEvent';
import { getIsDeleteSyncOperation, SyncEventActionOperations } from '../../getSyncMultipleEventsPayload';
import { CalendarsEventsCache } from '../interface';
import removeCalendarEventStoreRecord from './removeCalendarEventStoreRecord';

const getResponse = (responses: SyncMultipleApiResponses[], index: number) => {
    return responses.find((x) => x.Index === index);
};

export const upsertSyncMultiActionsResponses = (
    multiActions: SyncEventActionOperations[],
    multiResponses: SyncMultipleApiResponse[],
    calendarsEventsCache: CalendarsEventsCache
) => {
    for (let i = 0; i < multiResponses.length; ++i) {
        const actions = multiActions[i];
        const responses = multiResponses[i];

        const responsesArray = responses?.Responses;
        const calendarEventsCache = calendarsEventsCache.calendars[actions.calendarID];

        if (!Array.isArray(responsesArray) || !calendarEventsCache) {
            continue;
        }

        for (let j = 0; j < actions.operations.length; ++j) {
            const operation = actions.operations[j];
            const matchingResponse = getResponse(responsesArray, j);

            if (getIsDeleteSyncOperation(operation)) {
                if (!matchingResponse || matchingResponse.Response.Code === API_CODES.SINGLE_SUCCESS) {
                    removeCalendarEventStoreRecord(operation.data.Event.ID, calendarEventsCache);
                }
                continue;
            }

            if (matchingResponse) {
                const matchingEvent = matchingResponse.Response.Event;
                if (matchingEvent && matchingResponse.Response.Code === API_CODES.SINGLE_SUCCESS) {
                    upsertCalendarApiEvent(matchingEvent, calendarEventsCache);
                }
            }
        }
    }
};

export const upsertUpdateEventPartResponses = (
    operations: (UpdatePartstatOperation | UpdatePersonalPartOperation)[],
    responses: UpdateEventPartApiResponse[],
    calendarsEventsCache: CalendarsEventsCache
) => {
    for (let i = 0; i < responses.length; ++i) {
        const operation = operations[i];
        const { Code, Event } = responses[i];
        const calendarEventsCache = calendarsEventsCache.calendars[operation.data.calendarID];

        if (!calendarEventsCache) {
            continue;
        }

        if (Code === API_CODES.SINGLE_SUCCESS) {
            upsertCalendarApiEvent(Event, calendarEventsCache);
        }
    }
};

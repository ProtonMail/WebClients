import { API_CODES } from '@proton/shared/lib/constants';
import type {
    SyncMultipleApiResponse,
    SyncMultipleApiResponses,
    UpdateEventPartApiResponse,
} from '@proton/shared/lib/interfaces/calendar';

import type { OpenedMailEvent } from '../../../../hooks/useGetOpenedMailEvents';
import type {
    AttendeeDeleteSingleEditOperation,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../../interfaces/Invite';
import type { SyncEventActionOperations } from '../../getSyncMultipleEventsPayload';
import { getIsDeleteSyncOperation } from '../../getSyncMultipleEventsPayload';
import type { CalendarsEventsCache } from '../interface';
import { removeCalendarEventStoreRecord } from './removeCalendarEventStoreRecord';
import upsertCalendarApiEvent from './upsertCalendarApiEvent';

const getResponse = (responses: SyncMultipleApiResponses[], index: number) => {
    return responses.find((x) => x.Index === index);
};

export const upsertSyncMultiActionsResponses = (
    multiActions: SyncEventActionOperations[],
    multiResponses: SyncMultipleApiResponse[],
    calendarsEventsCache: CalendarsEventsCache,
    getOpenedMailEvents: () => OpenedMailEvent[]
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
                    removeCalendarEventStoreRecord(
                        operation.data.calendarEvent.ID,
                        calendarEventsCache,
                        getOpenedMailEvents
                    );
                }
                continue;
            }

            if (matchingResponse) {
                const matchingEvent = matchingResponse.Response.Event;
                if (matchingEvent && matchingResponse.Response.Code === API_CODES.SINGLE_SUCCESS) {
                    upsertCalendarApiEvent(matchingEvent, calendarEventsCache, getOpenedMailEvents);
                }
            }
        }
    }
};

export const upsertUpdateEventPartResponses = (
    operations: (UpdatePartstatOperation | UpdatePersonalPartOperation | AttendeeDeleteSingleEditOperation)[],
    responses: UpdateEventPartApiResponse[],
    calendarsEventsCache: CalendarsEventsCache,
    getOpenedMailEvents: () => OpenedMailEvent[]
) => {
    responses.forEach(({ Code, Event }, index) => {
        const {
            data: { calendarID },
        } = operations[index];
        const calendarEventsCache = calendarsEventsCache.calendars[calendarID];

        if (!calendarEventsCache) {
            return;
        }

        if (Code === API_CODES.SINGLE_SUCCESS) {
            upsertCalendarApiEvent(Event, calendarEventsCache, getOpenedMailEvents);
        }
    });
};

export const upsertAttendeeDeleteSingleEditResponses = (
    operations: (UpdatePartstatOperation | UpdatePersonalPartOperation | AttendeeDeleteSingleEditOperation)[],
    responses: UpdateEventPartApiResponse[],
    calendarsEventsCache: CalendarsEventsCache,
    getOpenedMailEvents: () => OpenedMailEvent[]
) => {
    responses.forEach(({ Code, Event }, index) => {
        const {
            data: { calendarID, eventID },
        } = operations[index];
        const calendarEventsCache = calendarsEventsCache.calendars[calendarID];

        if (!calendarEventsCache) {
            return;
        }

        if (Code === API_CODES.SINGLE_SUCCESS) {
            upsertCalendarApiEvent(Event, calendarEventsCache, getOpenedMailEvents);
            removeCalendarEventStoreRecord(eventID, calendarEventsCache, getOpenedMailEvents);
        }
    });
};

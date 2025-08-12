import { calendarUrlQueryParams } from './constants';
import { calendarUrlQueryParamsActions } from './constants';

export const getQueryParamsStatus = (search: string) => {
    const searchParams = new URLSearchParams(search);

    const isCreateMode = searchParams.get(calendarUrlQueryParams.action) === calendarUrlQueryParamsActions.create;
    const isEditMode = searchParams.get(calendarUrlQueryParams.action) === calendarUrlQueryParamsActions.edit;
    const calendarIdFromQueryParams = searchParams.get(calendarUrlQueryParams.calendarId);

    const eventId = searchParams.get(calendarUrlQueryParams.eventId);

    return {
        isCreateMode,
        isEditMode,
        calendarIdFromQueryParams,
        eventId,
    };
};

import { isValidMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize/purify';
import truncate from '@proton/utils/truncate';

import { calendarUrlQueryParams, calendarUrlQueryParamsActions } from './constants';

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

const validateTextParam = (value: string | null, maxLength: number): string | undefined => {
    if (!value) {
        return undefined;
    }

    const sanitizedValue = sanitizeMessage(value);

    const trimmed = sanitizedValue.trim();

    if (!trimmed) {
        return undefined;
    }

    return truncate(trimmed, maxLength);
};

const validateConferenceUrl = (url: string | null): string | undefined => {
    return url && isValidMeetingLink(url) ? url : undefined;
};

export const validateDeepLinkParams = (searchParams: URLSearchParams) => {
    return {
        title: validateTextParam(searchParams.get(calendarUrlQueryParams.title), MAX_CHARS_API.TITLE),
        location: validateTextParam(searchParams.get(calendarUrlQueryParams.location), MAX_CHARS_API.LOCATION),
        description: validateTextParam(
            searchParams.get(calendarUrlQueryParams.description),
            MAX_CHARS_API.EVENT_DESCRIPTION
        ),
        conferenceUrl: validateConferenceUrl(searchParams.get(calendarUrlQueryParams.conferenceUrl)),
    };
};

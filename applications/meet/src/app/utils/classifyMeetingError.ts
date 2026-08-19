import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { MEETING_LOCKED_ERROR_CODE } from '../constants';
import { isConnectionTimeoutError } from './connectionErrors';

export enum MeetingErrorKind {
    MeetingGone = 'meetingGone',
    MeetingLocked = 'meetingLocked',
    AlreadyNotified = 'alreadyNotified',
    ConnectionFailed = 'connectionFailed',
    Unknown = 'unknown',
}

export const classifyMeetingError = (error: any): MeetingErrorKind => {
    if (!error) {
        return MeetingErrorKind.Unknown;
    }

    if (error.userNotified) {
        return MeetingErrorKind.AlreadyNotified;
    }

    if (isConnectionTimeoutError(error)) {
        return MeetingErrorKind.ConnectionFailed;
    }

    const { code } = getApiError(error);

    if (code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
        return MeetingErrorKind.MeetingGone;
    }

    if (code === MEETING_LOCKED_ERROR_CODE) {
        return MeetingErrorKind.MeetingLocked;
    }

    return MeetingErrorKind.Unknown;
};

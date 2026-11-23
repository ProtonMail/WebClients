import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { ConnectionError, ConnectionErrorReason } from 'livekit-client';

import { INVALID_SRP_PARAMS_ERROR_CODE } from '@proton/meet/api/constants';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { MEETING_LOCKED_ERROR_CODE } from '../constants';
import { toMeetCoreErrorEnum } from '../wasm/meetCoreError';
import { isAccessTokenError } from './accessTokenError';
import { isConnectionTimeoutError } from './connectionErrors';

export enum MeetingErrorKind {
    MeetingNotAllowed = 'meetingNotAllowed',
    MeetingGone = 'meetingGone',
    MeetingLocked = 'meetingLocked',
    AlreadyNotified = 'alreadyNotified',
    ConnectionFailed = 'connectionFailed',
    MeetingOutdated = 'meetingOutdated',
    DeviceClock = 'deviceClock',
    WrongPassword = 'wrongPassword',
    Unknown = 'unknown',
}

const isLiveKitConnectionTimeout = (error: unknown) =>
    error instanceof ConnectionError && error.reason === ConnectionErrorReason.Timeout;

export const classifyMeetingError = (error: any): MeetingErrorKind => {
    if (!error) {
        return MeetingErrorKind.Unknown;
    }

    if (error.userNotified) {
        return MeetingErrorKind.AlreadyNotified;
    }

    if (isConnectionTimeoutError(error) || isLiveKitConnectionTimeout(error)) {
        return MeetingErrorKind.ConnectionFailed;
    }

    switch (toMeetCoreErrorEnum(error)) {
        case MeetCoreErrorEnum.MlsServerVersionNotSupported:
            return MeetingErrorKind.MeetingOutdated;
        case MeetCoreErrorEnum.CheckDeviceClock:
            return MeetingErrorKind.DeviceClock;
    }

    const { code } = getApiError(error);

    if (code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
        return MeetingErrorKind.MeetingGone;
    }

    if (code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED && isAccessTokenError(error)) {
        return MeetingErrorKind.MeetingNotAllowed;
    }

    if (code === MEETING_LOCKED_ERROR_CODE) {
        return MeetingErrorKind.MeetingLocked;
    }

    if (code === INVALID_SRP_PARAMS_ERROR_CODE) {
        return MeetingErrorKind.WrongPassword;
    }

    return MeetingErrorKind.Unknown;
};

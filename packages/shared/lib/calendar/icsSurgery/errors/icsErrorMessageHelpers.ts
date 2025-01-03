import { c } from 'ttag';

import type { EventInvitationErrorConfig } from '../EventInvitationError';
import { getICSImportErrorMessage } from './icsImportErrorMessage';
import { getICSInvitationErrorMessage } from './icsInvitationErrorMessage';
import type { INVITATION_ERROR_TYPE } from './icsSurgeryErrorTypes';
import { EVENT_INVITATION_ERROR_TYPE, IMPORT_EVENT_ERROR_TYPE } from './icsSurgeryErrorTypes';

type ErrorProps =
    | { errorType: INVITATION_ERROR_TYPE; config?: EventInvitationErrorConfig; errorOrigin: 'invitation' }
    | { errorType: IMPORT_EVENT_ERROR_TYPE; config?: Error; errorOrigin: 'import' };

export const getICSErrorMessage = ({ errorType, config, errorOrigin }: ErrorProps) => {
    const error = errorOrigin === 'invitation' ? (config as EventInvitationErrorConfig)?.extendedType : errorType;

    switch (error) {
        case EVENT_INVITATION_ERROR_TYPE.NON_GREGORIAN:
        case IMPORT_EVENT_ERROR_TYPE.NON_GREGORIAN:
            return c('ICS event error').t`Only the Gregorian calendar scale is allowed`;
        case EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_FLOATING_TIME:
        case IMPORT_EVENT_ERROR_TYPE.UNEXPECTED_FLOATING_TIME:
            return c('ICS event error').t`Floating times not supported`;
        case EVENT_INVITATION_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED:
        case IMPORT_EVENT_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED:
            return c('ICS event error').t`Calendar time zone not supported`;
        case EVENT_INVITATION_ERROR_TYPE.ALLDAY_INCONSISTENCY:
        case IMPORT_EVENT_ERROR_TYPE.ALLDAY_INCONSISTENCY:
            return c('ICS event error').t`Malformed all-day event`;
        case EVENT_INVITATION_ERROR_TYPE.TZID_UNSUPPORTED:
        case IMPORT_EVENT_ERROR_TYPE.TZID_UNSUPPORTED:
            return c('ICS event error').t`Time zone not supported`;
        case EVENT_INVITATION_ERROR_TYPE.DTSTART_MALFORMED:
        case IMPORT_EVENT_ERROR_TYPE.DTSTART_MALFORMED:
            return c('ICS event error').t`Malformed start time`;
        case EVENT_INVITATION_ERROR_TYPE.DTSTART_OUT_OF_BOUNDS:
        case IMPORT_EVENT_ERROR_TYPE.DTSTART_OUT_OF_BOUNDS:
            return c('ICS event error').t`Start time out of bounds`;
        case EVENT_INVITATION_ERROR_TYPE.DTEND_MALFORMED:
        case IMPORT_EVENT_ERROR_TYPE.DTEND_MALFORMED:
            return c('ICS event error').t`Malformed end time`;
        case EVENT_INVITATION_ERROR_TYPE.DTEND_OUT_OF_BOUNDS:
        case IMPORT_EVENT_ERROR_TYPE.DTEND_OUT_OF_BOUNDS:
            return c('ICS event error').t`End time out of bounds`;
        case EVENT_INVITATION_ERROR_TYPE.RRULE_MALFORMED:
        case IMPORT_EVENT_ERROR_TYPE.RRULE_MALFORMED:
            return c('ICS event error').t`Malformed recurring event`;
        case EVENT_INVITATION_ERROR_TYPE.RRULE_UNSUPPORTED:
        case IMPORT_EVENT_ERROR_TYPE.RRULE_UNSUPPORTED:
            return c('ICS event error').t`Recurring rule not supported`;
        case EVENT_INVITATION_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED:
        case IMPORT_EVENT_ERROR_TYPE.SINGLE_EDIT_UNSUPPORTED:
            return c('ICS event error').t`Edited event not supported`;
        case EVENT_INVITATION_ERROR_TYPE.NO_OCCURRENCES:
        case IMPORT_EVENT_ERROR_TYPE.NO_OCCURRENCES:
            return c('ICS event error').t`Recurring event has no occurrences`;

        default:
            if (errorOrigin === 'import') {
                return getICSImportErrorMessage(errorType, config);
            }

            if (errorOrigin === 'invitation') {
                return getICSInvitationErrorMessage(errorType, config);
            }
    }
};

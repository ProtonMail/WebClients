import { c } from 'ttag';

import { EventComponentIdentifiers } from '@proton/shared/lib/calendar/icsSurgery/interface';

import { ICAL_ATTENDEE_STATUS, ICAL_METHOD, ICAL_METHODS_ATTENDEE } from '../constants';

export enum INVITATION_ERROR_TYPE {
    INVITATION_INVALID,
    INVITATION_UNSUPPORTED,
    INVALID_METHOD,
    NO_COMPONENT,
    NO_VEVENT,
    PARSING_ERROR,
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    EVENT_CREATION_ERROR,
    EVENT_UPDATE_ERROR,
    CANCELLATION_ERROR,
    UNEXPECTED_ERROR,
    EXTERNAL_ERROR,
}

export enum EVENT_INVITATION_ERROR_TYPE {
    NON_GREGORIAN,
    INVALID_METHOD,
    NO_VEVENT,
    MISSING_ORIGINAL_UID,
    MISSING_ORGANIZER,
    MISSING_ORIGINAL_ORGANIZER,
    MISSING_ATTENDEE,
    DUPLICATE_ATTENDEES,
    UNEXPECTED_FLOATING_TIME,
    X_WR_TIMEZONE_UNSUPPORTED,
    TZID_UNSUPPORTED,
    DTSTART_MISSING,
    ALLDAY_INCONSISTENCY,
    DTSTART_MALFORMED,
    DTSTART_OUT_OF_BOUNDS,
    DTEND_MALFORMED,
    DTEND_OUT_OF_BOUNDS,
    RRULE_MALFORMED,
    RRULE_UNSUPPORTED,
    SINGLE_EDIT_UNSUPPORTED,
    NO_OCCURRENCES,
    EXTERNAL_ERROR,
    VALIDATION_ERROR,
}

const {
    INVITATION_INVALID,
    INVITATION_UNSUPPORTED,
    INVALID_METHOD,
    NO_COMPONENT,
    NO_VEVENT,
    PARSING_ERROR,
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    EVENT_CREATION_ERROR,
    EVENT_UPDATE_ERROR,
    CANCELLATION_ERROR,
    UNEXPECTED_ERROR,
    EXTERNAL_ERROR,
} = INVITATION_ERROR_TYPE;

export const getErrorMessage = (errorType: INVITATION_ERROR_TYPE, config?: EventInvitationErrorConfig) => {
    const isUnknown = !config?.method;
    const isImport = config?.method === ICAL_METHOD.PUBLISH;
    const isResponse = config?.method && ICAL_METHODS_ATTENDEE.includes(config?.method);
    const isProtonInvite = !!config?.isProtonInvite;

    if (errorType === INVITATION_INVALID) {
        if (isUnknown) {
            return c('Attached ics file error').t`Invalid ICS file`;
        }
        if (isImport) {
            return c('Attached ics file error').t`Invalid event`;
        }
        return isResponse
            ? c('Event invitation error').t`Invalid response`
            : c('Event invitation error').t`Invalid invitation`;
    }
    if (errorType === INVITATION_UNSUPPORTED) {
        if (isImport) {
            return c('Attached ics file error').t`Unsupported event`;
        }
        return isResponse
            ? c('Event invitation error').t`Unsupported response`
            : c('Event invitation error').t`Unsupported invitation`;
    }
    if (errorType === NO_COMPONENT) {
        return c('Attached ics file error').t`Empty ICS file`;
    }
    if (errorType === NO_VEVENT) {
        return c('Attached ics file error').t`Unsupported calendar component`;
    }
    if (errorType === INVALID_METHOD) {
        if (isUnknown) {
            return c('Attached ics file error').t`Invalid method`;
        }
        // Here we invert response <-> invitation as we take the perspective of the sender
        return isResponse
            ? c('Event invitation error').t`Invalid invitation`
            : c('Event invitation error').t`Invalid response`;
    }
    if (errorType === PARSING_ERROR) {
        return c('Event invitation error').t`Attached ICS file could not be read`;
    }
    if (errorType === DECRYPTION_ERROR) {
        return c('Event invitation error').t`Attached ICS file could not be decrypted`;
    }
    if (errorType === FETCHING_ERROR) {
        return c('Event invitation error').t`We could not retrieve the event from your calendar`;
    }
    if (errorType === UPDATING_ERROR) {
        return c('Event invitation error').t`We could not update the event in your calendar`;
    }
    if (errorType === EVENT_CREATION_ERROR) {
        return isProtonInvite
            ? c('Event invitation error').t`The event could not be added to your calendar. No answer was sent`
            : c('Event invitation error').t`Your answer was sent, but the event could not be added to your calendar`;
    }
    if (errorType === EVENT_UPDATE_ERROR) {
        return isProtonInvite
            ? c('Event invitation error').t`The event could not be updated in your calendar. No answer was sent`
            : c('Event invitation error').t`Your answer was sent, but the event could not be updated in your calendar`;
    }
    if (errorType === CANCELLATION_ERROR) {
        return c('Event invitation error').t`We could not cancel the event in your calendar`;
    }
    if (errorType === UNEXPECTED_ERROR) {
        return c('Event invitation error').t`Unexpected error`;
    }
    if (errorType === EXTERNAL_ERROR) {
        return config?.externalError?.message || '';
    }
    return '';
};

interface EventInvitationErrorConfig {
    hashedIcs?: string;
    componentIdentifiers?: EventComponentIdentifiers;
    extendedType?: EVENT_INVITATION_ERROR_TYPE;
    externalError?: Error;
    partstat?: ICAL_ATTENDEE_STATUS;
    timestamp?: number;
    isProtonInvite?: boolean;
    method?: ICAL_METHOD;
    originalUniqueIdentifier?: string;
}

export class EventInvitationError extends Error {
    type: INVITATION_ERROR_TYPE;

    hashedIcs: string;

    componentIdentifiers?: EventComponentIdentifiers;

    extendedType?: EVENT_INVITATION_ERROR_TYPE;

    method?: ICAL_METHOD;

    partstat?: ICAL_ATTENDEE_STATUS;

    timestamp?: number;

    isProtonInvite?: boolean;

    externalError?: Error;

    originalUniqueIdentifier?: string;

    constructor(errorType: INVITATION_ERROR_TYPE, config?: EventInvitationErrorConfig) {
        super(getErrorMessage(errorType, config));
        this.type = errorType;
        this.hashedIcs = config?.hashedIcs || '';
        this.componentIdentifiers = config?.componentIdentifiers;
        this.extendedType = config?.extendedType;
        this.method = config?.method;
        this.partstat = config?.partstat;
        this.timestamp = config?.timestamp;
        this.isProtonInvite = config?.isProtonInvite;
        this.externalError = config?.externalError;
        this.originalUniqueIdentifier = config?.originalUniqueIdentifier;
        Object.setPrototypeOf(this, EventInvitationError.prototype);
    }

    getConfig() {
        return {
            type: this.type,
            hashedIcs: this.hashedIcs,
            extendedType: this.extendedType,
            componentIdentifiers: this.componentIdentifiers,
            partstat: this.partstat,
            timestamp: this.timestamp,
            isProtonInvite: this.isProtonInvite,
            externalError: this.externalError,
            method: this.method,
            originalUniqueIdentifier: this.originalUniqueIdentifier,
        };
    }
}

export const cloneEventInvitationErrorWithConfig = (
    error: EventInvitationError,
    config: EventInvitationErrorConfig
) => {
    const newConfig = {
        ...error.getConfig(),
        ...config,
    };
    return new EventInvitationError(error.type, newConfig);
};

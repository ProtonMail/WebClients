import type { EventComponentIdentifiers } from '@proton/shared/lib/calendar/icsSurgery/interface';

import type { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '../constants';
import { getICSErrorMessage } from './errors/icsErrorMessageHelpers';
import type { EVENT_INVITATION_ERROR_TYPE, INVITATION_ERROR_TYPE } from './errors/icsSurgeryErrorTypes';

export interface EventInvitationErrorConfig {
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
        super(getICSErrorMessage({ errorType, config, errorOrigin: 'invitation' }));
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

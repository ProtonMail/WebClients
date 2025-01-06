import { c } from 'ttag';

import { ICAL_METHOD, ICAL_METHODS_ATTENDEE } from '../../constants';
import type { EventInvitationErrorConfig } from '../EventInvitationError';
import { EVENT_INVITATION_ERROR_TYPE, INVITATION_ERROR_TYPE } from './icsSurgeryErrorTypes';

export const getICSInvitationErrorMessage = (errorType: INVITATION_ERROR_TYPE, config?: EventInvitationErrorConfig) => {
    const isUnknown = !config?.method;
    const isImport = config?.method === ICAL_METHOD.PUBLISH;
    const isResponse = config?.method && ICAL_METHODS_ATTENDEE.includes(config?.method);
    const isProtonInvite = !!config?.isProtonInvite;

    switch (errorType) {
        case INVITATION_ERROR_TYPE.INVITATION_INVALID:
            if (config?.extendedType === EVENT_INVITATION_ERROR_TYPE.VALIDATION_ERROR) {
                return c('ICS event error').t`Event validation failed`;
            }

            if (isUnknown) {
                return c('Attached ics file error').t`Invalid ICS file`;
            }
            if (isImport) {
                return c('Attached ics file error').t`Invalid event`;
            }
            return isResponse
                ? c('Event invitation error').t`Invalid response`
                : c('Event invitation error').t`Invalid invitation`;
        case INVITATION_ERROR_TYPE.INVITATION_UNSUPPORTED:
            if (isImport) {
                return c('Attached ics file error').t`Unsupported event`;
            }
            return isResponse
                ? c('Event invitation error').t`Unsupported response`
                : c('Event invitation error').t`Unsupported invitation`;
        case INVITATION_ERROR_TYPE.INVALID_METHOD:
            if (isUnknown) {
                return c('Attached ics file error').t`Invalid method`;
            }
            // Here we invert response <-> invitation as we take the perspective of the sender
            return isResponse
                ? c('Event invitation error').t`Invalid invitation`
                : c('Event invitation error').t`Invalid response`;
        case INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR:
            return isProtonInvite
                ? c('Event invitation error').t`The event could not be added to your calendar. No answer was sent`
                : c('Event invitation error')
                      .t`Your answer was sent, but the event could not be added to your calendar`;
        case INVITATION_ERROR_TYPE.EVENT_UPDATE_ERROR:
            return isProtonInvite
                ? c('Event invitation error').t`The event could not be updated in your calendar. No answer was sent`
                : c('Event invitation error')
                      .t`Your answer was sent, but the event could not be updated in your calendar`;
        case INVITATION_ERROR_TYPE.NO_COMPONENT:
            return c('Attached ics file error').t`Empty ICS file`;
        case INVITATION_ERROR_TYPE.NO_VEVENT:
            return c('Attached ics file error').t`Unsupported calendar component`;
        case INVITATION_ERROR_TYPE.PARSING_ERROR:
            return c('Event invitation error').t`Attached ICS file could not be read`;
        case INVITATION_ERROR_TYPE.DECRYPTION_ERROR:
            return c('Event invitation error').t`Attached ICS file could not be decrypted`;
        case INVITATION_ERROR_TYPE.FETCHING_ERROR:
            return c('Event invitation error').t`We could not retrieve the event from your calendar`;
        case INVITATION_ERROR_TYPE.UPDATING_ERROR:
            return c('Event invitation error').t`We could not update the event in your calendar`;
        case INVITATION_ERROR_TYPE.CANCELLATION_ERROR:
            return c('Event invitation error').t`We could not cancel the event in your calendar`;
        case INVITATION_ERROR_TYPE.UNEXPECTED_ERROR:
            return c('Event invistation error').t`Unexpected error`;
        case INVITATION_ERROR_TYPE.EXTERNAL_ERROR:
            return config?.externalError?.message || '';
    }
};

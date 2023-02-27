import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { Address } from '@proton/shared/lib/interfaces';
import { EventModelReadView } from '@proton/shared/lib/interfaces/calendar';

import { getParticipantsError } from '../components/eventModal/helpers';

export const getEventStatusTraits = (model: EventModelReadView) => {
    const { status: eventStatus, selfAttendeeIndex } = model;
    if (model.isAttendee && eventStatus === ICAL_EVENT_STATUS.CONFIRMED) {
        const selfAttendee = selfAttendeeIndex !== undefined ? model.attendees[selfAttendeeIndex] : undefined;
        if (selfAttendee) {
            const { partstat } = selfAttendee;
            return {
                isUnanswered: partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                isTentative: partstat === ICAL_ATTENDEE_STATUS.TENTATIVE,
                isCancelled: partstat === ICAL_ATTENDEE_STATUS.DECLINED,
            };
        }
    }
    return {
        isTentative: eventStatus === ICAL_EVENT_STATUS.TENTATIVE,
        isCancelled: eventStatus === ICAL_EVENT_STATUS.CANCELLED,
    };
};

export const getCanEditEvent = ({
    isCalendarDisabled,
    isSubscribedCalendar,
    notificationsRevampAvailable,
}: {
    isCalendarDisabled: boolean;
    isSubscribedCalendar: boolean;
    notificationsRevampAvailable: boolean;
}) => {
    if (isSubscribedCalendar) {
        return notificationsRevampAvailable;
    }
    return !isCalendarDisabled;
};

export const getCanDeleteEvent = ({
    isOwnedCalendar,
    isCalendarWritable,
    isInvitation,
}: {
    isOwnedCalendar: boolean;
    isCalendarWritable: boolean;
    isInvitation: boolean;
}) => {
    if (!isCalendarWritable) {
        return false;
    }
    if (!isOwnedCalendar) {
        return !isInvitation;
    }
    return true;
};

export const getCanDuplicateEvent = ({
    isSubscribedCalendar,
    isOwnedCalendar,
    isOrganizer,
    isInvitation,
}: {
    isSubscribedCalendar: boolean;
    isOwnedCalendar: boolean;
    isOrganizer: boolean;
    isInvitation: boolean;
}) => {
    if (isSubscribedCalendar) {
        return false;
    }
    if (isOwnedCalendar) {
        return isInvitation ? isOrganizer : true;
    }
    return !isInvitation;
};

export const getCanChangeCalendarOfEvent = ({
    isCreateEvent,
    isOwnedCalendar,
    isCalendarWritable,
    isSingleEdit,
    isInvitation,
    isAttendee,
    isOrganizer,
}: {
    isCreateEvent: boolean;
    isOwnedCalendar: boolean;
    isCalendarWritable: boolean;
    isSingleEdit: boolean;
    isInvitation: boolean;
    isAttendee: boolean;
    isOrganizer: boolean;
}) => {
    if (isCreateEvent) {
        return true;
    }
    if (!isCalendarWritable) {
        return false;
    }
    if (isInvitation) {
        if (!isOwnedCalendar) {
            return false;
        }
        if (isAttendee) {
            return !isSingleEdit;
        }
        if (isOrganizer) {
            return false;
        }
        // we should never fall here, but just in case
        return false;
    }
    return true;
};

export const getCannotSaveEvent = ({
    isOwnedCalendar,
    isOrganizer,
    numberOfAttendees,
    canEditSharedEventData = true,
}: {
    isOwnedCalendar: boolean;
    isOrganizer: boolean;
    numberOfAttendees: number;
    canEditSharedEventData?: boolean;
}) => {
    if (!canEditSharedEventData) {
        // user is editing only notifications
        return false;
    }
    if (isOrganizer) {
        return !!getParticipantsError({ isOwnedCalendar, numberOfAttendees });
    }
    return false;
};

export const getCanEditSharedEventData = ({
    isOwnedCalendar,
    isCalendarWritable,
    isOrganizer,
    isAttendee,
    isInvitation,
    selfAddress,
}: {
    isOwnedCalendar: boolean;
    isCalendarWritable: boolean;
    isOrganizer: boolean;
    isAttendee: boolean;
    isInvitation: boolean;
    selfAddress?: Address;
}) => {
    if (!isCalendarWritable) {
        return false;
    }
    if (isInvitation) {
        if (isOwnedCalendar) {
            if (isAttendee) {
                return false;
            }
            if (isOrganizer) {
                return selfAddress ? getIsAddressActive(selfAddress) : false;
            }
            return false;
        }
        return false;
    }
    return true;
};

export const getCanReplyToEvent = ({
    isOwnedCalendar,
    isCalendarWritable,
    isAttendee,
    isCancelled,
}: {
    isOwnedCalendar: boolean;
    isCalendarWritable: boolean;
    isAttendee: boolean;
    isCancelled: boolean;
}) => {
    return isOwnedCalendar && isCalendarWritable && isAttendee && !isCancelled;
};

export const getIsAvailableCalendar = ({
    isOwnedCalendar,
    isCalendarWritable,
    isInvitation,
}: {
    isOwnedCalendar: boolean;
    isCalendarWritable: boolean;
    isInvitation: boolean;
}) => {
    if (!isCalendarWritable) {
        return false;
    }
    if (isInvitation) {
        return isOwnedCalendar;
    }
    return true;
};

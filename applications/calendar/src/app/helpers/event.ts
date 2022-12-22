import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { EventModelReadView } from '@proton/shared/lib/interfaces/calendar';

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

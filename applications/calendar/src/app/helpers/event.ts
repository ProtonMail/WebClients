import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { EventModelReadView } from '@proton/shared/lib/interfaces/calendar';

import { DecryptedEventTupleResult } from '../containers/calendar/eventStore/interface';

interface GetComponentArguments {
    decryptedEventResult: DecryptedEventTupleResult;
    memberID: string;
}

export const getComponentWithPersonalPart = ({ decryptedEventResult, memberID }: GetComponentArguments) => {
    const component = decryptedEventResult[0].veventComponent;
    const personalMap = decryptedEventResult[1][memberID];
    const {
        veventComponent: { components: valarmComponents = [] },
    } = personalMap || { veventComponent: {} };
    return {
        ...component,
        components: valarmComponents,
    };
};

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

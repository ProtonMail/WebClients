import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from 'proton-shared/lib/calendar/constants';
import { cleanEmail } from 'proton-shared/lib/helpers/email';
import { Address } from 'proton-shared/lib/interfaces';
import { DecryptedEventTupleResult } from '../containers/calendar/eventStore/interface';
import { EventModelReadView } from '../interfaces/EventModel';

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

export const getEventStatusTraits = ({
    model,
    addresses = [],
}: {
    model: EventModelReadView;
    addresses?: Address[];
}) => {
    const cleanUserEmails = addresses.map(({ Email }) => cleanEmail(Email));
    const eventStatus = model.status;
    if (!model.isOrganizer && eventStatus === ICAL_EVENT_STATUS.CONFIRMED) {
        const userAttendee = model.attendees.find((attendee) => cleanUserEmails.includes(cleanEmail(attendee.email)));
        if (userAttendee) {
            const { partstat } = userAttendee;
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

import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { getSelfAddressData } from '@proton/shared/lib/calendar/deserialize';
import { getVeventStatus } from '@proton/shared/lib/calendar/vcalHelper';
import { Address } from '@proton/shared/lib/interfaces';

import { VisualSearchItem } from './interface';

export const getEventTraits = (event: VisualSearchItem, addresses: Address[]) => {
    const { Status, Attendees, Organizer } = event;
    const eventStatus = getVeventStatus({ status: { value: Status } });
    const isCancelled = eventStatus === ICAL_EVENT_STATUS.CANCELLED;
    const { selfAttendeeIndex } = getSelfAddressData({
        organizer: Organizer,
        attendees: Attendees,
        addresses,
    });

    const selfAttendee = selfAttendeeIndex !== undefined && Attendees?.[selfAttendeeIndex];
    if (eventStatus === ICAL_EVENT_STATUS.CONFIRMED && !!selfAttendee) {
        const partstat = selfAttendee.parameters?.partstat;
        return {
            isUnanswered: partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            isCancelled: partstat === ICAL_ATTENDEE_STATUS.DECLINED,
        };
    }

    return { isCancelled };
};

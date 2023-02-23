import { FREQUENCY, ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { EventModelReadView } from '@proton/shared/lib/interfaces/calendar';

import getIsTemporaryViewEvent from '../../containers/calendar/getIsTemporaryViewEvent';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';

const getEventInformation = (calendarViewEvent: CalendarViewEvent, model: EventModelReadView) => {
    const { calendarData, eventReadResult } = calendarViewEvent.data;

    const isTemporaryEvent = getIsTemporaryViewEvent(calendarViewEvent);
    const tmpData = isTemporaryEvent ? (calendarViewEvent as CalendarViewEventTemporaryEvent).tmpData : undefined;
    const isEventReadLoading = !isTemporaryEvent && !eventReadResult;

    const calendarColor = tmpData?.calendar.color || calendarData.Color;
    const eventTitleSafe = getDisplayTitle(tmpData?.title || model.title);
    const isCancelled = model.status === ICAL_EVENT_STATUS.CANCELLED;
    const isRecurring = model.frequencyModel.type !== FREQUENCY.ONCE;
    const isSingleEdit = !!eventReadResult?.result?.[0]?.veventComponent?.['recurrence-id'];
    const { selfAddress, selfAttendeeIndex } = model;
    const selfAttendee = selfAttendeeIndex !== undefined ? model.attendees[selfAttendeeIndex] : undefined;

    return {
        isTemporaryEvent,
        isEventReadLoading,
        tmpData,
        calendarColor,
        eventReadError: eventReadResult?.error,
        eventTitleSafe,
        verificationStatus: eventReadResult?.result?.[0]?.verificationStatus,
        isInvitation: !!model.organizer,
        isCancelled,
        isRecurring,
        isSingleEdit,
        userPartstat: selfAttendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
        isSelfAddressActive: selfAddress ? getIsAddressActive(selfAddress) : true,
    };
};

export default getEventInformation;

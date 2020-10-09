import { FREQUENCY, ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from 'proton-shared/lib/calendar/constants';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import { Address } from 'proton-shared/lib/interfaces';
import getIsTemporaryViewEvent from '../../containers/calendar/getIsTemporaryViewEvent';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { findUserAttendeeModel } from '../../helpers/attendees';
import { EventModelReadView } from '../../interfaces/EventModel';

const getEventInformation = (
    calendarViewEvent: CalendarViewEvent,
    model: EventModelReadView,
    addresses: Address[] = []
) => {
    const { calendarData, eventReadResult } = calendarViewEvent.data;

    const isTemporaryEvent = getIsTemporaryViewEvent(calendarViewEvent);
    const tmpData = isTemporaryEvent ? (calendarViewEvent as CalendarViewEventTemporaryEvent).tmpData : undefined;

    const isEventReadLoading = !isTemporaryEvent && !eventReadResult;
    const eventReadError = eventReadResult?.error;

    const calendarColor = tmpData?.calendar.color || calendarData.Color;
    const eventTitleSafe = getDisplayTitle(tmpData?.title || model.title);
    const isCancelled = model.status === ICAL_EVENT_STATUS.CANCELLED;
    const isRecurring = model.frequencyModel.type !== FREQUENCY.ONCE;
    const isSingleEdit = !!eventReadResult?.result?.[0]['recurrence-id'];
    const { userAttendee, userAddress } = findUserAttendeeModel(model.attendees, addresses);

    return {
        isTemporaryEvent,
        isEventReadLoading,
        tmpData,
        calendarColor,
        eventReadError,
        eventTitleSafe,
        isCancelled,
        isRecurring,
        isSingleEdit,
        userPartstat: userAttendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
        isAddressDisabled: userAddress ? userAddress.Status === 0 : true,
    };
};

export default getEventInformation;

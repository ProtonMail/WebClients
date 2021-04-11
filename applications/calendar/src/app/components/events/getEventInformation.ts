import { FREQUENCY, ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from 'proton-shared/lib/calendar/constants';
import { getAggregatedEventVerificationStatus } from 'proton-shared/lib/calendar/decrypt';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import { getIsAddressDisabled } from 'proton-shared/lib/helpers/address';
import { EventModelReadView } from 'proton-shared/lib/interfaces/calendar';
import getIsTemporaryViewEvent from '../../containers/calendar/getIsTemporaryViewEvent';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';

const getEventInformation = (calendarViewEvent: CalendarViewEvent, model: EventModelReadView) => {
    const { calendarData, eventReadResult } = calendarViewEvent.data;

    const isTemporaryEvent = getIsTemporaryViewEvent(calendarViewEvent);
    const tmpData = isTemporaryEvent ? (calendarViewEvent as CalendarViewEventTemporaryEvent).tmpData : undefined;

    const isEventReadLoading = !isTemporaryEvent && !eventReadResult;
    const eventReadError = eventReadResult?.error;
    const decryptedPersonalVeventMap = eventReadResult?.result?.[1] || {};
    const verificationStatusPersonal = Object.values(decryptedPersonalVeventMap).map(
        (result) => result?.verificationStatus
    );
    const verificationStatusRest = eventReadResult?.result?.[0]?.verificationStatus;
    const verificationStatus = getAggregatedEventVerificationStatus([
        ...verificationStatusPersonal,
        verificationStatusRest,
    ]);

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
        eventReadError,
        eventTitleSafe,
        verificationStatus,
        isCancelled,
        isRecurring,
        isSingleEdit,
        userPartstat: selfAttendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
        isSelfAddressDisabled: getIsAddressDisabled(selfAddress),
    };
};

export default getEventInformation;

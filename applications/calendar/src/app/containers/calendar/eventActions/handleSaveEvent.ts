import { c } from 'ttag';
import { useGetAddressKeys } from 'react-components';
import { omit } from 'proton-shared/lib/helpers/object';
import { noop } from 'proton-shared/lib/helpers/function';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { Calendar, CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { modelToVeventComponent } from '../../../components/eventModal/eventForm/modelToProperties';
import getMemberAndAddress from '../../../helpers/getMemberAndAddress';
import getEditEventData from '../event/getEditEventData';
import getAllEventsByUID from '../getAllEventsByUID';
import { getOriginalEvent } from './recurringHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { RECURRING_TYPES } from '../../../constants';
import { EventPersonalMap } from '../../../interfaces/EventPersonalMap';
import handleSaveSingleEvent from './handleSaveSingleEvent';
import handleSaveRecurringEvent from './handleSaveRecurringEvent';
import withVeventRruleWkst from './rruleWkst';

interface Arguments {
    temporaryEvent: any; // todo
    weekStartsOn: number;

    addresses: Address[];
    calendars: Calendar[];

    onSaveConfirmation: (data: any) => Promise<RECURRING_TYPES>;

    api: Api;
    call: () => Promise<void>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getDecryptedEvent: (Event: CalendarEvent) => Promise<undefined | [VcalVeventComponent, EventPersonalMap]>;
    createNotification: (data: any) => void;
}

const handleSaveEvent = async ({
    temporaryEvent,
    weekStartsOn,

    addresses,
    calendars,

    onSaveConfirmation,

    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    getDecryptedEvent,
    getCalendarBootstrap,
    createNotification
}: Arguments) => {
    const {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        tmpOriginalTarget: { data: { Event: oldEvent, readEvent, recurrence } } = { data: {} },
        tmpData,
        tmpData: {
            calendar: { id: newCalendarID },
            member: { memberID: newMemberID, addressID: newAddressID }
        }
    } = temporaryEvent;

    // All updates will remove any existing exdates since they would be more complicated to normalize
    const modelVeventComponent = modelToVeventComponent(tmpData) as VcalVeventComponent;
    const newVeventComponent = withVeventRruleWkst(omit(modelVeventComponent, ['exdate']), weekStartsOn);

    const newEventData = {
        veventComponent: newVeventComponent,
        calendarID: newCalendarID,
        memberID: newMemberID,
        addressID: newAddressID
    };

    // Creation
    if (!oldEvent) {
        return handleSaveSingleEvent({
            newEventData,

            calendars,
            api,
            call,
            getAddressKeys,
            getCalendarKeys,
            createNotification
        });
    }

    const calendarBootstrap = getCalendarBootstrap(oldEvent.CalendarID);
    if (!calendarBootstrap) {
        throw new Error('Trying to update event without a calendar');
    }

    const oldEventData = getEditEventData({
        Event: oldEvent,
        eventResult: readEvent(oldEvent.CalendarID, oldEvent.ID)?.[0],
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, oldEvent.Author)
    });

    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!recurrence && !oldEventData.recurrenceID) {
        return handleSaveSingleEvent({
            oldEventData,
            newEventData,

            calendars,
            api,
            call,
            getAddressKeys,
            getCalendarKeys,
            createNotification
        });
    }

    const recurrences = await getAllEventsByUID(api, oldEventData.uid);

    const originalEvent = getOriginalEvent(recurrences);
    const originalEventResult = originalEvent ? await getDecryptedEvent(originalEvent).catch(noop) : undefined;
    if (!originalEvent || !originalEventResult?.[0]) {
        createNotification({
            text: c('Recurring update').t`Cannot save a recurring event without the original event`,
            type: 'error'
        });
        throw new Error('Original event not found');
    }

    const originalEventData = getEditEventData({
        Event: originalEvent,
        eventResult: originalEventResult,
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, originalEvent.Author)
    });

    const actualRecurrence =
        recurrence ||
        getSingleEditRecurringData(originalEventData.mainVeventComponent, oldEventData.mainVeventComponent);

    // Warning: Single edits do not have the RRULE currently. Mutate the model directly with the old RRULE.
    if (newVeventComponent['recurrence-id']) {
        newVeventComponent.rrule = originalEventData.mainVeventComponent.rrule;
    }

    return handleSaveRecurringEvent({
        originalEventData,
        oldEventData,
        newEventData,

        canOnlySaveAll: actualRecurrence.isSingleOccurrence,
        onSaveConfirmation,

        recurrence: actualRecurrence,
        recurrences,
        api,
        call,
        createNotification,
        getAddressKeys,
        getCalendarKeys,
        calendars
    });
};

export default handleSaveEvent;

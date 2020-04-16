import { useGetAddressKeys } from 'react-components';
import { omit } from 'proton-shared/lib/helpers/object';
import { noop } from 'proton-shared/lib/helpers/function';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { Calendar, CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { modelToVeventComponent } from '../../../components/eventModal/eventForm/modelToProperties';
import getMemberAndAddress from '../../../helpers/getMemberAndAddress';
import getEditEventData from '../event/getEditEventData';
import getAllEventsByUID from '../getAllEventsByUID';
import { getOriginalEvent } from './recurringHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { VcalVeventComponent } from '../../../interfaces/VcalModel';
import { RECURRING_TYPES } from '../../../constants';
import { EventPersonalMap } from '../../../interfaces/EventPersonalMap';
import handleSaveSingleEvent from './handleSaveSingleEvent';
import handleSaveRecurringEvent from './handleSaveRecurringEvent';

interface Arguments {
    temporaryEvent: any;

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
    const newVeventComponent = omit(modelVeventComponent, ['exdate']);

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
        eventResult: readEvent(oldEvent.CalendarID, oldEvent.ID)[0],
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
    if (!originalEvent) {
        throw new Error('Original event not found');
    }

    const originalEventData = getEditEventData({
        Event: originalEvent,
        eventResult: await getDecryptedEvent(originalEvent).catch(noop),
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, originalEvent.Author)
    });

    const actualRecurrence =
        recurrence ||
        getSingleEditRecurringData(originalEventData.mainVeventComponent, oldEventData.mainVeventComponent);

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

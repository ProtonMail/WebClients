import { useGetAddressKeys } from 'react-components';
import { Api } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { getOccurrences } from 'proton-shared/lib/calendar/recurring';
import {
    getEventCreatedText,
    getEventUpdatedText,
    getRecurringEventCreatedText,
} from '../../../components/eventModal/eventForm/i18n';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import handleSaveSingleEventHelper from './handleSaveSingleEventHelper';

interface Arguments {
    oldEditEventData?: EventOldData;
    newEditEventData: EventNewData;

    calendars: Calendar[];
    api: Api;
    call: () => Promise<void>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    createNotification: (data: any) => void;
}

const getSingleEventText = (oldEventData: EventOldData | undefined, newEventData: EventNewData) => {
    const isCreate = !oldEventData?.eventData;
    const isRecurring = newEventData.veventComponent.rrule;

    if (isCreate && isRecurring) {
        const twoOccurrences = getOccurrences({
            component: newEventData.veventComponent,
            maxCount: 2,
        });
        if (twoOccurrences.length === 1) {
            return getEventCreatedText();
        }
        return getRecurringEventCreatedText();
    }
    if (isCreate) {
        return getEventCreatedText();
    }
    return getEventUpdatedText();
};

/*
const wrapEventAction = (promise: Promise) => {
    createNotification({ text: 'Creating event' });
    try {
        setEventInCache(eventToSet, calendarCache);
        const result = await promise;
        const eventToSet = getApiEventToSet(result.Event);
        setEventInCache(eventToSet, calendarCache);
        createNotification({ text: 'Event created' });
    } catch (error) {
        setEventInCache(eventToSet, calendarCache);
        createNotification({ text: 'Error creating event' });
    }
}
 */

const handleSaveSingleEvent = async ({
    oldEditEventData,
    newEditEventData,

    calendars,
    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    createNotification,
}: Arguments) => {
    const promise = handleSaveSingleEventHelper({
        oldEditEventData,
        newEditEventData,
        api,
        getAddressKeys,
        getCalendarKeys,
        calendars,
    });
    await promise;
    await call();
    createNotification({ text: getSingleEventText(oldEditEventData, newEditEventData) });
};

export default handleSaveSingleEvent;

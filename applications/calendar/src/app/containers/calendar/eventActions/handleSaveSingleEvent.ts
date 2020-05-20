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
    oldEventData?: EventOldData;
    newEventData: EventNewData;

    calendars: Calendar[];
    api: Api;
    call: () => Promise<void>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    createNotification: (data: any) => void;
}

const getSingleEventText = (oldEventData: EventOldData | undefined, newEventData: EventNewData) => {
    const isCreate = !oldEventData?.Event;
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

const handleSaveSingleEvent = async ({
    oldEventData,
    newEventData,

    calendars,
    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    createNotification,
}: Arguments) => {
    await handleSaveSingleEventHelper({
        oldEventData,
        newEventData,
        api,
        getAddressKeys,
        getCalendarKeys,
        calendars,
    });
    await call();
    createNotification({ text: getSingleEventText(oldEventData, newEventData) });
};

export default handleSaveSingleEvent;

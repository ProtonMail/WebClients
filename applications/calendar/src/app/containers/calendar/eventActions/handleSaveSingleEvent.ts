import { useGetAddressKeys } from 'react-components';
import { Api } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { getEventCreatedText, getEventUpdatedText } from '../../../components/eventModal/eventForm/i18n';
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
const handleSaveSingleEvent = async ({
    oldEventData,
    newEventData,

    calendars,
    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    createNotification
}: Arguments) => {
    await handleSaveSingleEventHelper({
        oldEventData,
        newEventData,
        api,
        getAddressKeys,
        getCalendarKeys,
        calendars
    });

    await call();

    const isCreate = !oldEventData?.Event;
    createNotification({ text: isCreate ? getEventCreatedText() : getEventUpdatedText() });
};

export default handleSaveSingleEvent;

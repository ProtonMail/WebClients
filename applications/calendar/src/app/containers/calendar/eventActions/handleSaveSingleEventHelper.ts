import { useGetAddressKeys } from 'react-components';
import {
    getCreateCalendarEvent,
    getSwitchCalendarEvent,
    getUpdateCalendarEvent,
} from 'proton-shared/lib/calendar/integration/createOrUpdateEvent';
import { updateCalendar } from 'proton-shared/lib/api/calendars';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { Api } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import getCreationKeys from '../getCreationKeys';
import { EventOldData, EventNewData } from '../../../interfaces/EventData';

interface SaveEventHelperArguments {
    oldEventData?: EventOldData;
    newEventData: EventNewData;

    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    calendars: Calendar[];
}

const handleSaveSingleEventHelper = async ({
    oldEventData,
    newEventData: {
        calendarID: newCalendarID,
        addressID: newAddressID,
        memberID: newMemberID,
        veventComponent: newVeventComponent,
    },
    api,
    getAddressKeys,
    getCalendarKeys,
    calendars,
}: SaveEventHelperArguments) => {
    const oldEvent = oldEventData?.Event;
    const oldCalendarID = oldEventData?.calendarID;

    const isUpdateEvent = !!oldEvent;
    const isSwitchCalendar = isUpdateEvent && oldCalendarID !== newCalendarID;

    const [addressKeys, newCalendarKeys, oldCalendarKeys] = await Promise.all([
        getAddressKeys(newAddressID),
        getCalendarKeys(newCalendarID),
        isSwitchCalendar && oldCalendarID ? getCalendarKeys(oldCalendarID) : undefined,
    ]);
    const data = await createCalendarEvent({
        eventComponent: newVeventComponent,
        isSwitchCalendar,
        ...(await getCreationKeys({ Event: oldEvent, addressKeys, newCalendarKeys, oldCalendarKeys })),
    });

    if (isSwitchCalendar) {
        await api(
            getSwitchCalendarEvent({
                calendarID: newCalendarID,
                memberID: newMemberID,
                data,
                UID: newVeventComponent.uid.value,
            })
        );
    } else if (isUpdateEvent) {
        await api(getUpdateCalendarEvent({ memberID: newMemberID, data, Event: oldEvent }));
    } else {
        await api(getCreateCalendarEvent({ calendarID: newCalendarID, memberID: newMemberID, data }));
    }

    const calendar = calendars.find(({ ID }) => ID === newCalendarID);
    if (calendar && !calendar.Display) {
        await api(updateCalendar(newCalendarID, { Display: 1 }));
    }
};

export default handleSaveSingleEventHelper;

import { Address } from '@proton/shared/lib/interfaces';
import { CalendarEvent, Member } from '@proton/shared/lib/interfaces/calendar';
import parseMainEventData from './parseMainEventData';
import { getRecurrenceIdDate } from './getEventHelper';
import { getComponentWithPersonalPart } from '../../../helpers/event';
import { DecryptedEventTupleResult } from '../eventStore/interface';

interface GetEditEventDataArguments {
    eventData: CalendarEvent;
    eventResult?: DecryptedEventTupleResult;
    memberResult: [Member, Address];
}

const getEditEventData = ({ eventData, eventResult, memberResult: [member, address] }: GetEditEventDataArguments) => {
    const mainVeventComponent = parseMainEventData(eventData);
    if (!mainVeventComponent) {
        throw new Error('Unparseable event');
    }

    const uid = mainVeventComponent.uid.value;
    if (!uid) {
        throw new Error('Event without UID');
    }

    const recurrenceID = getRecurrenceIdDate(mainVeventComponent);

    const veventComponentFull = eventResult
        ? getComponentWithPersonalPart({
              decryptedEventResult: eventResult,
              memberID: member.ID,
          })
        : undefined;

    return {
        eventData,
        calendarID: eventData.CalendarID,
        memberID: member.ID,
        addressID: address.ID,
        mainVeventComponent,
        veventComponent: veventComponentFull,
        uid,
        recurrenceID,
    };
};

export default getEditEventData;

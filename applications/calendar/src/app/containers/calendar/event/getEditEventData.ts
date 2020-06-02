import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { Address } from 'proton-shared/lib/interfaces';
import { Member } from 'proton-shared/lib/interfaces/calendar';
import parseMainEventData from './parseMainEventData';
import { getRecurrenceId } from './getEventHelper';
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

    const recurrenceID = getRecurrenceId(mainVeventComponent);

    const veventComponentFull = eventResult
        ? getComponentWithPersonalPart({
              component: eventResult[0],
              personalMap: eventResult[1],
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

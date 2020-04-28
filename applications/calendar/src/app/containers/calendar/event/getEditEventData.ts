import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { Address } from 'proton-shared/lib/interfaces';
import { Member } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import parseMainEventData from './parseMainEventData';
import { getRecurrenceId } from './getEventHelper';
import { EventPersonalMap } from '../../../interfaces/EventPersonalMap';
import { getComponentWithPersonalPart } from '../../../helpers/event';

interface GetEditEventDataArguments {
    Event: CalendarEvent;
    eventResult?: [VcalVeventComponent, EventPersonalMap];
    memberResult: [Member, Address];
}

const getEditEventData = ({ Event, eventResult, memberResult: [member, address] }: GetEditEventDataArguments) => {
    const mainVeventComponent = parseMainEventData(Event);
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
              memberID: member.ID
          })
        : undefined;

    return {
        Event,
        calendarID: Event.CalendarID,
        memberID: member.ID,
        addressID: address.ID,
        mainVeventComponent,
        veventComponent: veventComponentFull,
        uid,
        recurrenceID
    };
};

export default getEditEventData;

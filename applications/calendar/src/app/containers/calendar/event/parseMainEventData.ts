import { CALENDAR_CARD_TYPE } from 'proton-shared/lib/calendar/constants';
import { parse } from 'proton-shared/lib/calendar/vcal';
import { unwrap } from 'proton-shared/lib/calendar/helper';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

const { CLEAR_TEXT, SIGNED } = CALENDAR_CARD_TYPE;

const parseMainEventData = ({ SharedEvents = [] }: CalendarEvent): VcalVeventComponent | undefined => {
    try {
        const unencryptedPart = SharedEvents.find(({ Type }) => [CLEAR_TEXT, SIGNED].includes(Type));
        const component = parse(unwrap(unencryptedPart?.Data || '')) as VcalVeventComponent;
        if (component.component !== 'vevent') {
            return undefined;
        }
        return component;
    } catch (e) {
        return undefined;
    }
};

export default parseMainEventData;

import { CALENDAR_CARD_TYPE } from '@proton/shared/lib/calendar/constants';
import { unwrap } from '@proton/shared/lib/calendar/helper';
import { parse } from '@proton/shared/lib/calendar/vcal';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

const parseMainEventData = ({ SharedEvents = [] }: CalendarEvent): VcalVeventComponent | undefined => {
    try {
        const unencryptedPart = SharedEvents.find(({ Type }) =>
            [CALENDAR_CARD_TYPE.CLEAR_TEXT, CALENDAR_CARD_TYPE.SIGNED].includes(Type)
        );
        const component = parse(unwrap(unencryptedPart?.Data || '')) as VcalVeventComponent;
        if (component.component !== 'vevent') {
            return undefined;
        }
        return component;
    } catch (e: any) {
        return undefined;
    }
};

export default parseMainEventData;

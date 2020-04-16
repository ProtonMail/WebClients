import { parse } from 'proton-shared/lib/calendar/vcal';
import { unwrap } from 'proton-shared/lib/calendar/helper';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { VcalVeventComponent } from '../../../interfaces/VcalModel';

const parseMainEventData = ({ SharedEvents = [] }: CalendarEvent): VcalVeventComponent | undefined => {
    try {
        const { Data = '' } = SharedEvents.find(({ Type }) => Type === 2) || { Data: '' };
        const component = parse(unwrap(Data)) as VcalVeventComponent;
        if (component.component !== 'vevent') {
            return undefined;
        }
        return component;
    } catch (e) {
        return undefined;
    }
};

export default parseMainEventData;

import { FREQUENCY } from './constants';
import { VcalDays, VcalRrulePropertyValue, VcalVeventComponent } from '../interfaces/calendar/VcalModel';
import { numericDayToDay } from './vcalConverter';
import { omit } from '../helpers/object';

/**
 * WKST is significant when a WEEKLY "RRULE" has an interval greater than 1,
 * and a BYDAY rule part is specified.  This is also significant when
 * in a YEARLY "RRULE" when a BYWEEKNO rule part is specified. The
 * default value is MO. From rfc5545
 */
export const withRruleWkst = (rrule: VcalRrulePropertyValue, wkst = VcalDays.MO): VcalRrulePropertyValue => {
    if (wkst !== VcalDays.MO) {
        const isWeeklySignificant =
            rrule.freq === FREQUENCY.WEEKLY && (rrule.interval ?? 0) >= 1 && rrule.byday !== undefined;

        const isYearlySignificant = rrule.freq === FREQUENCY.YEARLY && rrule.byweekno !== undefined;

        if (isWeeklySignificant || isYearlySignificant) {
            return {
                ...rrule,
                wkst: numericDayToDay(wkst),
            };
        }
    }

    if (!rrule.wkst) {
        return rrule;
    }

    return omit(rrule, ['wkst']);
};

const withVeventRruleWkst = <T>(vevent: VcalVeventComponent & T, wkst: VcalDays): VcalVeventComponent & T => {
    if (!vevent.rrule) {
        return vevent;
    }
    return {
        ...vevent,
        rrule: { value: withRruleWkst(vevent.rrule.value, wkst) },
    };
};

export default withVeventRruleWkst;

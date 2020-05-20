import { VcalDays, VcalRruleProperty, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { numericDayToDay } from 'proton-shared/lib/calendar/vcalConverter';
import { omit } from 'proton-shared/lib/helpers/object';
import { FREQUENCY } from '../../../constants';

/**
 * WKST is significant when a WEEKLY "RRULE" has an interval greater than 1,
 * and a BYDAY rule part is specified.  This is also significant when
 * in a YEARLY "RRULE" when a BYWEEKNO rule part is specified. The
 * default value is MO. From rfc5545
 */
export const withRruleWkst = (rrule: VcalRruleProperty, wkst = VcalDays.MO): VcalRruleProperty => {
    if (wkst !== VcalDays.MO) {
        const isWeeklySignificant =
            rrule.value?.freq === FREQUENCY.WEEKLY &&
            (rrule.value?.interval ?? 0) >= 1 &&
            rrule.value?.byday !== undefined;

        const isYearlySignificant = rrule.value?.freq === FREQUENCY.YEARLY && rrule.value?.byweekno !== undefined;

        if (isWeeklySignificant || isYearlySignificant) {
            return {
                ...rrule,
                value: {
                    ...rrule.value,
                    wkst: numericDayToDay(wkst),
                },
            };
        }
    }

    if (!rrule.value?.wkst) {
        return rrule;
    }

    return {
        ...rrule,
        value: omit(rrule.value, ['wkst']),
    };
};

const withVeventRruleWkst = (vevent: VcalVeventComponent, wkst: VcalDays): VcalVeventComponent => {
    if (!vevent.rrule) {
        return vevent;
    }
    return {
        ...vevent,
        rrule: withRruleWkst(vevent.rrule, wkst),
    };
};

export default withVeventRruleWkst;

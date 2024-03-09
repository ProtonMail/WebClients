import { toExdate } from '@proton/shared/lib/calendar/exdate';
import { propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getIsPropertyAllDay, getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import uniqueBy from '@proton/utils/uniqueBy';

import { withIncrementedSequence } from '../eventActions/sequence';

/**
 * Returns a new event with an EXDATE for the cancelled occurrence. If the EXDATE was already present, returns undefined
 */
const deleteSingleRecurrence = (component: VcalVeventComponent, localStartToExclude: Date) => {
    const { dtstart, exdate: oldExdate = [] } = component;

    const singleExdate = toExdate(
        fromUTCDate(localStartToExclude),
        getIsPropertyAllDay(dtstart),
        getPropertyTzid(dtstart)
    );

    const isExistingExdate = oldExdate.some((oldExdate) => {
        return +propertyToUTCDate(oldExdate) === +propertyToUTCDate(singleExdate);
    });

    if (isExistingExdate) {
        return;
    }

    const newExdates = uniqueBy([...oldExdate, singleExdate], (property) => {
        return +toUTCDate(property.value);
    }).sort((a, b) => {
        return +toUTCDate(a.value) - +toUTCDate(b.value);
    });

    return withIncrementedSequence({
        ...component,
        exdate: newExdates,
    }) as VcalVeventComponent;
};

export default deleteSingleRecurrence;

import { toExdate } from '@proton/shared/lib/calendar/exdate';
import { getIsPropertyAllDay, getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import uniqueBy from '@proton/utils/uniqueBy';

const deleteSingleRecurrence = (component: VcalVeventComponent, localStartToExclude: Date) => {
    const { dtstart, exdate: oldExdate = [] } = component;

    const singleExdate = toExdate(
        fromUTCDate(localStartToExclude),
        getIsPropertyAllDay(dtstart),
        getPropertyTzid(dtstart)
    );

    const newExdates = uniqueBy([...oldExdate, singleExdate], (property) => {
        return +toUTCDate(property.value);
    }).sort((a, b) => {
        return +toUTCDate(a.value) - +toUTCDate(b.value);
    });

    return {
        ...component,
        exdate: newExdates,
    } as VcalVeventComponent;
};

export default deleteSingleRecurrence;

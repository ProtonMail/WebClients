import { getPropertyTzid, isIcalPropertyAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { fromUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { omit } from 'proton-shared/lib/helpers/object';
import { getUntilProperty } from '../../../components/eventModal/eventForm/modelToFrequencyProperties';

const deleteFutureRecurrence = (component, localStartToExclude, occurrenceNumber) => {
    const { dtstart, rrule } = component;

    if (rrule.value.count) {
        const newCount = occurrenceNumber - 1;

        if (newCount <= 1) {
            return omit(component, ['rrule']);
        }

        return {
            ...component,
            rrule: {
                ...rrule,
                value: {
                    ...rrule.value,
                    count: newCount
                }
            }
        };
    }

    // Subtract one day from the local start, and get until property which in the end yields the previous day at 23:59:59
    const until = getUntilProperty(
        fromUTCDate(addDays(localStartToExclude, -1)),
        isIcalPropertyAllDay(dtstart),
        getPropertyTzid(dtstart)
    );

    return {
        ...component,
        rrule: {
            ...rrule,
            value: {
                ...rrule.value,
                until
            }
        }
    };
};

export default deleteFutureRecurrence;

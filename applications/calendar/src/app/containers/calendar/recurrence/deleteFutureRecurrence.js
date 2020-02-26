import { getPropertyTzid, isIcalPropertyAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { fromUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { getUntilProperty } from '../../../components/eventModal/eventForm/modelToFrequencyProperties';

const deleteFutureRecurrence = (component, localStartToExclude, occurrenceNumber) => {
    const { dtstart, rrule } = component;

    if (rrule.value.count) {
        return {
            ...component,
            rrule: {
                ...rrule,
                value: {
                    ...rrule.value,
                    count: occurrenceNumber - 1
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

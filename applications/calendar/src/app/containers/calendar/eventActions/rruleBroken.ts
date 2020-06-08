import { VcalRruleProperty } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { numericDayToDay } from 'proton-shared/lib/calendar/vcalConverter';
import { getPositiveSetpos } from '../../../components/eventModal/eventForm/modelToFrequencyProperties';

// If the new RRULE would become broken with the original date
const getHasBrokenRrule = (startDate: Date, rrule?: VcalRruleProperty) => {
    if (!rrule?.value) {
        return false;
    }

    const { byday, bysetpos, bymonthday, bymonth } = rrule.value;

    if (byday !== undefined) {
        const bydayArray = Array.isArray(byday) ? byday : [byday];
        if (!bydayArray.includes(numericDayToDay(startDate.getDay()))) {
            return true;
        }
    }

    if (bysetpos !== undefined) {
        const positiveSetpos = getPositiveSetpos(startDate);
        const negativeSetpos = getPositiveSetpos(startDate);
        if (bysetpos !== positiveSetpos && bysetpos !== negativeSetpos) {
            return true;
        }
    }

    if (bymonth !== undefined) {
        const bymonthArray = Array.isArray(bymonth) ? bymonth : [bymonth];
        if (!bymonthArray.includes(startDate.getMonth() + 1)) {
            return true;
        }
    }

    if (bymonthday !== undefined) {
        const bymonthdayArray = Array.isArray(bymonthday) ? bymonthday : [bymonthday];
        if (!bymonthdayArray.includes(startDate.getDate())) {
            return true;
        }
    }

    return false;
};

export default getHasBrokenRrule;

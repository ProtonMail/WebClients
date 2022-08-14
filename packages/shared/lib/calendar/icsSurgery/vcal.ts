import { normalize } from '../../helpers/string';
import { VcalStringProperty } from '../../interfaces/calendar';
import { ICAL_CALSCALE } from '../constants';

export const getSupportedStringValue = (property?: VcalStringProperty) => {
    const trimmedValue = property?.value?.trim();
    if (!trimmedValue) {
        // return undefined for empty strings
        return;
    }
    return trimmedValue;
};

export const getSupportedCalscale = (calscale?: VcalStringProperty) => {
    if (!calscale) {
        return ICAL_CALSCALE.GREGORIAN;
    }

    return normalize(calscale.value) === normalize(ICAL_CALSCALE.GREGORIAN) ? ICAL_CALSCALE.GREGORIAN : undefined;
};

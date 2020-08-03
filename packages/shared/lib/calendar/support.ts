import { VcalDateOrDateTimeProperty, VcalDateTimeProperty, VcalUidProperty } from '../interfaces/calendar/VcalModel';
import { MAX_LENGTHS, MAXIMUM_DATE_UTC, MINIMUM_DATE_UTC } from './constants';
import { propertyToUTCDate } from './vcalConverter';
import { getIsPropertyAllDay } from './vcalHelper';

export const getSupportedUID = (uid: VcalUidProperty) => {
    // The API does not accept UIDs longer than 191 characters
    const uidLength = uid.value.length;
    const croppedUID = uid.value.substring(uidLength - MAX_LENGTHS.UID, uidLength);
    return { value: croppedUID };
};

const getIsWellFormedDateTime = (property: VcalDateTimeProperty) => {
    return property.value.isUTC || !!property.parameters!.tzid;
};

export const getIsWellFormedDateOrDateTime = (property: VcalDateOrDateTimeProperty) => {
    return getIsPropertyAllDay(property) || getIsWellFormedDateTime(property);
};

export const getIsDateOutOfBounds = (property: VcalDateOrDateTimeProperty) => {
    const dateUTC: Date = propertyToUTCDate(property);
    return +dateUTC < +MINIMUM_DATE_UTC || +dateUTC > +MAXIMUM_DATE_UTC;
};

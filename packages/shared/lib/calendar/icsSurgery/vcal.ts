import { VcalStringProperty } from '../../interfaces/calendar';

export const getSupportedStringValue = (property?: VcalStringProperty) => {
    const trimmedValue = property?.value?.trim();
    if (!trimmedValue) {
        // return undefined for empty strings
        return;
    }
    return trimmedValue;
};

import { extractEmailAddress } from '@proton/shared/lib/calendar/vcalConverter';
import { VcalOrganizerProperty } from '@proton/shared/lib/interfaces/calendar/VcalModel';

export const propertiesToOrganizerModel = (organizer?: VcalOrganizerProperty) => {
    if (!organizer) {
        return;
    }
    const email = extractEmailAddress(organizer);
    if (email === undefined) {
        throw new Error('Malformed organizer');
    }
    const { cn = '' } = organizer?.parameters || {};
    return {
        email,
        cn,
    };
};

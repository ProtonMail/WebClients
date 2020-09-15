import { extractEmailAddress } from 'proton-shared/lib/calendar/vcalConverter';
import { VcalOrganizerProperty } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { OrganizerModel } from '../../../interfaces/EventModel';

export const propertiesToOrganizerModel = (organizer?: VcalOrganizerProperty): OrganizerModel => {
    if (!organizer) {
        return {
            email: '',
            cn: '',
        };
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

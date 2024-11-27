import { EdugainAffiliations } from '@proton/shared/lib/interfaces';

// Affiliations won't be translated for now
export const EdugainAffiliationLabels: Record<EdugainAffiliations, string> = {
    [EdugainAffiliations.STUDENT]: 'Student',
    [EdugainAffiliations.FACULTY]: 'Faculty',
    [EdugainAffiliations.STAFF]: 'Staff',
    [EdugainAffiliations.ALUM]: 'Alum',
    [EdugainAffiliations.AFFILIATE]: 'Affiliate',
    [EdugainAffiliations.EMPLOYEE]: 'Employee',
    [EdugainAffiliations.LIBRARY_WALK_IN]: 'Library Walk-In',
};

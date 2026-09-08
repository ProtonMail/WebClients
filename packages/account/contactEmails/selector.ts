import { createSelector } from '@reduxjs/toolkit';

import { getContactEmailsMapWithDuplicates } from '@proton/shared/lib/contacts/getContactEmailsMap';

import { selectContactEmails } from './index';

export const selectContactEmailsMap = createSelector(
    [selectContactEmails],
    (contactEmails): ReturnType<typeof getContactEmailsMapWithDuplicates> => {
        return getContactEmailsMapWithDuplicates(contactEmails.value ?? []);
    }
);

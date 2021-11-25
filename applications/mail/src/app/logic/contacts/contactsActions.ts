import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { createAction } from '@reduxjs/toolkit';

export const refresh = createAction<{ contacts: ContactEmail[]; contactGroups: ContactGroup[] }>('contacts/refresh');

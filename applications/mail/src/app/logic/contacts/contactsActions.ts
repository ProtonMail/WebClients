import { createAction } from '@reduxjs/toolkit';

import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

export const refresh = createAction<{ contacts: ContactEmail[]; contactGroups: ContactGroup[] }>('contacts/refresh');

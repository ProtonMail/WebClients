import { createAction } from '@reduxjs/toolkit';

import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';

export const refresh = createAction<{ contacts: ContactEmail[]; contactGroups: ContactGroup[] }>('contacts/refresh');

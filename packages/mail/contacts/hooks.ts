import { createHooks } from '@proton/redux-utilities';

import { contactsThunk, selectContacts } from './index';

const hooks = createHooks(contactsThunk, selectContacts);

export const useContacts = hooks.useValue;
export const useGetContacts = hooks.useGet;

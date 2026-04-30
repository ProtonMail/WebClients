import { createHooks } from '@proton/redux-utilities/hooks';

import { contactsThunk, selectContacts } from './index';

const hooks = createHooks(contactsThunk, selectContacts);

export const useContacts = hooks.useValue;
export const useGetContacts = hooks.useGet;

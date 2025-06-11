import { createHooks } from '@proton/redux-utilities';

import { contactEmailsThunk, selectContactEmails } from './index';

const hooks = createHooks(contactEmailsThunk, selectContactEmails);

export const useContactEmails = hooks.useValue;
export const useGetContactEmails = hooks.useGet;

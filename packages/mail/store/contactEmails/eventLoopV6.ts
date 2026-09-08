import { contactEmailsEventLoopV6Thunk, selectContactEmails } from '@proton/account/contactEmails';

import type { ContactEventLoopV6Callback } from '../contactEventLoop/interface';

export const contactEmailsLoop: ContactEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.ContactEmails?.length && selectContactEmails(state)?.value) {
        return dispatch(contactEmailsEventLoopV6Thunk({ event, api }));
    }
};

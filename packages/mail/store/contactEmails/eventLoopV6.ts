import type { ContactEventLoopV6Callback } from '../contactEventLoop/interface';
import { contactEmailsEventLoopV6Thunk, selectContactEmails } from './index';

export const contactEmailsLoop: ContactEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.ContactEmails?.length && selectContactEmails(state)?.value) {
        return dispatch(contactEmailsEventLoopV6Thunk({ event, api }));
    }
};

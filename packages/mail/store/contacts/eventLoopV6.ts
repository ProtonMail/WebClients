import type { ContactEventLoopV6Callback } from '../contactEventLoop/interface';
import { contactsEventLoopV6Thunk, selectContacts } from './index';

export const contactsLoop: ContactEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Contacts?.length && selectContacts(state)?.value) {
        return dispatch(contactsEventLoopV6Thunk({ event, api }));
    }
};

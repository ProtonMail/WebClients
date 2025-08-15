import type { ContactEmailsState } from '@proton/mail/store/contactEmails';
import type { ContactsState } from '@proton/mail/store/contacts';
import type { ProtonDispatch } from '@proton/redux-shared-store-types';
import type { ContactEventV6Response } from '@proton/shared/lib/api/events';
import type { Api } from '@proton/shared/lib/interfaces';

export type ContactEventLoopV6RequiredState = ContactsState & ContactEmailsState;

export type ContactEventLoopV6Callback = ({
    event,
    state,
}: {
    event: ContactEventV6Response;
    state: ContactEventLoopV6RequiredState;
    dispatch: ProtonDispatch<any>;
    api: Api;
}) => Promise<any> | undefined;

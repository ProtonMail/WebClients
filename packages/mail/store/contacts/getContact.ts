import { getContact as getContactApi } from '@proton/shared/lib/api/contacts';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Contact } from '@proton/shared/lib/interfaces/contacts/Contact';

export const getContact = (api: Api, contactID: string) =>
    api<{
        Contact: Contact;
    }>(getContactApi(contactID)).then(({ Contact }) => Contact);

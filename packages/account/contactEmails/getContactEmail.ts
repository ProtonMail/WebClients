import { queryContactEmail } from '@proton/shared/lib/api/contacts';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

export const getContactEmail = (api: Api, contactEmailID: string) =>
    api<{ ContactEmail: ContactEmail }>(queryContactEmail(contactEmailID)).then(({ ContactEmail }) => ContactEmail);

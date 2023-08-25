import { Contact } from '@proton/shared/lib/interfaces/contacts';

export type GetContacts = () => Promise<Contact[]>;

import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

export type GetContactEmails = () => Promise<ContactEmail[]>;

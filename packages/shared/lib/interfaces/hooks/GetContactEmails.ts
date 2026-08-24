import type { ContactEmail } from '../contacts';

export type GetContactEmails = () => Promise<ContactEmail[]>;

import { Contact } from './Contact';

export interface FormattedContact extends Contact {
    emails: string[];
}

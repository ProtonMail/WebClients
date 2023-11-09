import { EncryptionPreferences } from '../../mail/encryptionPreferences';
import { ContactEmail } from '../contacts';

export type GetEncryptionPreferences = ({
    email,
    intendedForEmail,
    lifetime,
    contactEmailsMap,
}: {
    email: string;
    /**
     * Whether the preferences are used in the context of email encryption.
     * If true, internal keys with e2ee disabled are not returned.
     */
    intendedForEmail?: boolean;
    lifetime?: number;
    contactEmailsMap?: { [email: string]: ContactEmail | undefined };
}) => Promise<EncryptionPreferences>;

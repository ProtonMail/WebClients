import { EncryptionPreferences } from '../../mail/encryptionPreferences';
import { ContactEmail } from '../contacts';

export type GetEncryptionPreferences = ({
    email,
    intendedForEmail,
    lifetime,
    contactEmailsMap,
}: {
    email: string;
    intendedForEmail?: boolean;
    lifetime?: number;
    contactEmailsMap?: { [email: string]: ContactEmail | undefined };
}) => Promise<EncryptionPreferences>;

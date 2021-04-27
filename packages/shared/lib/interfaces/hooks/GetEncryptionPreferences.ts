import { EncryptionPreferences } from '../../mail/encryptionPreferences';
import { ContactEmail } from '../contacts';

export type GetEncryptionPreferences = (
    emailAddress: string,
    lifetime?: number,
    contactEmailsMap?: { [email: string]: ContactEmail | undefined }
) => Promise<EncryptionPreferences>;

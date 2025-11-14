import type { EncryptionPreferences } from '../../mail/encryptionPreferences';
import type { ContactEmail } from '../contacts';

export interface GetEncryptionPreferencesArguments {
    email: string;
    /**
     * Whether the preferences are used in the context of email encryption.
     * If true, internal keys with e2ee disabled are not returned.
     */
    intendedForEmail?: boolean;
    lifetime?: number;
    contactEmailsMap?: { [email: string]: ContactEmail | undefined };
}

export type GetEncryptionPreferencesResult = Promise<EncryptionPreferences>;
export type GetEncryptionPreferences = (args: GetEncryptionPreferencesArguments) => GetEncryptionPreferencesResult;

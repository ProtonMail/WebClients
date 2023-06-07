import { VerificationPreferences } from '../VerificationPreferences';
import { ContactEmail } from '../contacts';

export type GetVerificationPreferences = (
    emailAddress: string,
    lifetime?: number,
    contactEmailsMap?: { [email: string]: ContactEmail | undefined }
) => Promise<VerificationPreferences>;

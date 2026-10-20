import type { VerificationPreferences } from '../VerificationPreferences';
import type { ContactEmail } from '../contacts/Contact';

export type GetVerificationPreferences = ({
    email,
    lifetime,
    contactEmailsMap,
}: {
    email: string;
    lifetime?: number;
    contactEmailsMap?: { [email: string]: ContactEmail | undefined };
}) => Promise<VerificationPreferences>;

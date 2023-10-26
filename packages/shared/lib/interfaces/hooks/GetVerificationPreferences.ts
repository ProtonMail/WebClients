import { VerificationPreferences } from '../VerificationPreferences';
import { ContactEmail } from '../contacts';

export type GetVerificationPreferences = ({
    email,
    lifetime,
    contactEmailsMap,
}: {
    email: string;
    lifetime?: number;
    contactEmailsMap?: { [email: string]: ContactEmail | undefined };
}) => Promise<VerificationPreferences>;

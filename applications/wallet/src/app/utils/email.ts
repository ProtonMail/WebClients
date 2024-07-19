import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';

export const isSelfAddress = (email: string | undefined, addresses: Address[]) =>
    !!addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(email || ''));

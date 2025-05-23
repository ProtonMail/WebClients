import type { UserMailboxOutput } from '@proton/pass/types';
import { normalize } from '@proton/shared/lib/helpers/string';

/* Normalize unicode representation of the string
 * Remove diacritics (accents) + 20 max characters length
 * for the auto-derived alias name.
 * Removes trailing/leading dots. */
export const deriveAliasPrefix = (name: string) => {
    const prefix = normalize(name, true)
        .replace(/[^a-z0-9\-\_.]/g, '')
        .slice(0, 20);

    return prefix.replace(/\.*$/, '').replace(/^\.+/, '');
};

/** Mailbox is unverified or the new changed email requires verification */
export const mailboxVerificationRequired = (mailbox: UserMailboxOutput) =>
    Boolean(!mailbox.Verified || mailbox.PendingEmail);

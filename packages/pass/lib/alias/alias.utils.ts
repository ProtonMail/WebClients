import type { UserMailboxOutput } from '@proton/pass/types';

/** Mailbox is unverified or the new changed email requires verification */
export const mailboxVerificationRequired = (mailbox: UserMailboxOutput) =>
    Boolean(!mailbox.Verified || mailbox.PendingEmail);

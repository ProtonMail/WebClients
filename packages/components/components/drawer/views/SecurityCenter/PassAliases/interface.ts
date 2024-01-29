import type { AliasOptions, Share, ShareType } from '@proton/pass/types';

export type PassAliasesVault = Share<ShareType.Vault>;

export interface CreateModalFormState {
    name: string;
    /** The complete alias email. Ex: sampleName.suffix@domainname.ext */
    alias: string;
    /** The signed suffix is the suffix + token ensuring it's a valid one */
    signedSuffix: string;
    /** The e-mail this alias should forward to */
    mailbox: AliasOptions['mailboxes'][number];
    /** Alias text notes */
    note: string;
}

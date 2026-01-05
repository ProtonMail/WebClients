import type { MaybeNull } from '@proton/pass/types';

import type { UniqueItem } from './items';

export type AliasMailbox = { email: string; id: number };
export type AliasStats = { forwardedEmails: number; repliedEmails: number; blockedEmails: number };
export type AliasSuffix = {
    suffix: string;
    signedSuffix: string;
    isPremium: boolean;
    isCustom: boolean;
    domain: string;
};
export type AliasOptions = { mailboxes: AliasMailbox[]; suffixes: AliasSuffix[] };
export type AliasDetails = {
    aliasEmail: string;
    availableMailboxes: AliasMailbox[];
    mailboxes: AliasMailbox[];
    /** If user can modify alias details (mailboxes, displayName etc...) */
    modify: boolean;
    /** The display name, e.g `John`. The default BE value for a new alias is an empty string */
    name: string;
    /** The display name including email, e.g `John <alias@domain>`.
     * The default BE value is `Hello <alias@domain>`, even if the name is empty */
    displayName: string;
    slNote: string;
    stats?: AliasStats;
};
export type AliasPending = { pendingAliasID: string; aliasEmail: string; aliasNote: string };
export type AliasContactNewDTO = UniqueItem & { email: string; name?: string };
export type AliasContactInfoDTO = UniqueItem & { contactId: number };
export type AliasContactBlockDTO = AliasContactInfoDTO & { blocked: boolean };
export type AliasCreateFromPendingDTO = { shareId: string; pendingAliases: AliasPending[] };
export type AliasToggleStatusDTO = UniqueItem & { enabled: boolean };

export type MailboxDTO = { mailboxID: number };
export type MailboxDeleteDTO = MailboxDTO & { transferMailboxID?: MaybeNull<number> };
export type MailboxEditDTO = MailboxDTO & { email: string };
export type MailboxVerifyDTO = { mailboxID: number; code: string };

export type CatchAllDTO = { domainID: number; catchAll: boolean };
export type CustomDomainMailboxesDTO = { domainID: number; mailboxIDs: number[] };
export type CustomDomainNameDTO = { domainID: number; name: MaybeNull<string> };
export type RandomPrefixDTO = { domainID: number; randomPrefix: boolean };

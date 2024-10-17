import type { MaybeNull } from '@proton/pass/types';

import type { UniqueItem } from './items';

export type AliasMailbox = { email: string; id: number };
export type AliasStats = { forwardedEmails: number; repliedEmails: number; blockedEmails: number };
export type AliasSuffix = { suffix: string; signedSuffix: string; isCustom: boolean; domain: string };
export type AliasOptions = { mailboxes: AliasMailbox[]; suffixes: AliasSuffix[] };
export type AliasDetails = {
    aliasEmail: string;
    availableMailboxes: AliasMailbox[];
    mailboxes: AliasMailbox[];
    name: string;
    displayName: string;
    stats: AliasStats;
};
export type AliasPending = { pendingAliasID: string; aliasEmail: string; aliasNote: string };
export type AliasContactInfoDTO = UniqueItem & { contactId: number };
export type AliasContactBlockDTO = AliasContactInfoDTO & { blocked: boolean };
export type AliasCreateFromPendingDTO = { shareId: string; pendingAliases: AliasPending[] };
export type AliasToggleStatusDTO = UniqueItem & { enabled: boolean };

export type MailboxDeleteDTO = { mailboxID: number; transferMailboxID: MaybeNull<number> };
export type MailboxDefaultDTO = { defaultMailboxID: number };

export type CatchAllDTO = { domainID: number; catchAll: boolean };
export type CustomDomainMailboxesDTO = { domainID: number; mailboxIDs: number[] };
export type CustomDomainNameDTO = { domainID: number; name: MaybeNull<string> };
export type RandomPrefixDTO = { domainID: number; randomPrefix: boolean };

import type { UniqueItem } from './items';

export type AliasMailbox = { email: string; id: number };
export type AliasSuffix = { suffix: string; signedSuffix: string; isCustom: boolean; domain: string };
export type AliasOptions = { mailboxes: AliasMailbox[]; suffixes: AliasSuffix[] };
export type AliasDetails = { aliasEmail: string; mailboxes: AliasMailbox[] };
export type AliasSyncStatus = { enabled: boolean; pendingAliasCount: number };
export type AliasPending = { pendingAliasID: string; aliasEmail: string; aliasNote: string };
export type AliasCreateFromPendingDTO = { shareId: string; pendingAliases: AliasPending[] };
export type AliasToggleStatusDTO = UniqueItem & { enabled: boolean };

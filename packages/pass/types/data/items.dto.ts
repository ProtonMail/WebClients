import type { MaybeNull } from '@proton/pass/types';

import type { CustomAliasCreateRequest } from '../api';
import type { ItemType } from '../protobuf';
import type { IndexedByShareIdAndItemId, Item, ItemRevision } from './items';

type AliasMailbox = {
    id: number;
    email: string;
};

export type AliasCreationDTO = {
    mailboxes: AliasMailbox[];
    prefix: CustomAliasCreateRequest['Prefix'];
    signedSuffix: CustomAliasCreateRequest['SignedSuffix'];
    aliasEmail: string;
};

export type LoginWithAliasCreationDTO = { withAlias: true; alias: ItemCreateIntent<'alias'> } | { withAlias: false };
/**
 * Item creation DTO indexed on ItemType keys
 * - alias specifics : extra parameters required for alias creation
 * - login specifics : support login with alias creation intent
 */
export type ItemCreateIntentDTO = {
    alias: AliasCreationDTO;
    login: LoginWithAliasCreationDTO;
    note: never;
};

export type ItemEditIntentDTO = {
    alias: { aliasOwner: boolean; mailboxes: AliasMailbox[]; aliasEmail: string };
    login: never;
    note: never;
};

export type ItemImportIntentDTO = {
    alias: { aliasEmail: string };
    login: never;
    note: never;
};

/* Intent payloads */
export type ItemCreateIntent<T extends ItemType = ItemType> = Item<T, ItemCreateIntentDTO> & {
    optimisticId: string;
    shareId: string;
    createTime: number;
};

export type ItemEditIntent<T extends ItemType = ItemType> = Item<T, ItemEditIntentDTO> & {
    itemId: string;
    shareId: string;
    lastRevision: number;
};

export type ItemImportIntent<T extends ItemType = ItemType> = Item<T, ItemImportIntentDTO> & {
    trashed: boolean;
    createTime?: number;
    modifyTime?: number;
};

export type ItemMoveDTO = { before: ItemRevision; after: ItemRevision };

/** This data-structure does not uses lists to avoid
 * iterations when checking for inclusions  */
export type BulkSelectionDTO = IndexedByShareIdAndItemId<true>;

export type ItemRevisionsIntent = {
    shareId: string;
    itemId: string;
    since: MaybeNull<string>;
    pageSize: MaybeNull<number>;
};

export type ItemRevisionsSuccess = {
    revisions: ItemRevision[];
    /** Token that was last used */
    since: MaybeNull<string>;
    /** Token to use to get next page */
    next: MaybeNull<string>;
    total: number;
};

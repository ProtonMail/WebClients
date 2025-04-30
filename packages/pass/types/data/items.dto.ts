import type { FileAttachmentsDTO, FileDescriptor, MaybeNull, ShareId, UniqueItem } from '@proton/pass/types';

import type { CustomAliasCreateRequest } from '../api';
import type { ItemType } from '../protobuf';
import type { IndexedByShareIdAndItemId, Item, ItemRevision, OptimisticItem, SelectedItem } from './items';

type AliasMailbox = { id: number; email: string };

export type AliasCreationDTO = {
    mailboxes: AliasMailbox[];
    prefix: CustomAliasCreateRequest['Prefix'];
    signedSuffix: CustomAliasCreateRequest['SignedSuffix'];
    aliasEmail: string;
};

export type LoginWithAliasCreationDTO =
    | { withAlias: true; alias: Omit<ItemCreateIntent<'alias'>, 'files'> }
    | { withAlias: false };
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
    alias: MaybeNull<{
        aliasOwner: boolean;
        mailboxes: AliasMailbox[];
        aliasEmail: string;
        displayName: string;
        slNote: string;
    }>;
    login: never;
    note: never;
    creditCard: never;
    identity: never;
};

export type ItemImportIntentDTO = {
    alias: { aliasEmail: string };
    login: never;
    note: never;
};

export type ItemCreateIntent<T extends ItemType = ItemType> = OptimisticItem &
    Item<T, ItemCreateIntentDTO> & { files: FileAttachmentsDTO };

export type ItemCreateSuccess = OptimisticItem & { item: ItemRevision; alias?: ItemRevision };

export type ItemEditIntent<T extends ItemType = ItemType> = Item<T, ItemEditIntentDTO> & {
    itemId: string;
    shareId: string;
    lastRevision: number;
    files: FileAttachmentsDTO;
};

export type ItemMoveIntent = SelectedItem & { targetShareId: ShareId };

export type ItemImportIntent<T extends ItemType = ItemType> = Item<T, ItemImportIntentDTO> & {
    trashed: boolean;
    createTime?: number;
    modifyTime?: number;
    files?: string[];
};

export type ItemMoveDTO = { before: ItemRevision; after: ItemRevision };

/** This data-structure does not uses lists to avoid
 * iterations when checking for inclusions  */
export type BulkSelectionDTO = IndexedByShareIdAndItemId<true>;

export type ItemRevisionsIntent = {
    itemId: string;
    pageSize: number;
    shareId: string;
    since: MaybeNull<string>;
};

export type ItemRevisionsSuccess = {
    next: MaybeNull<string>;
    revisions: ItemRevision[];
    since: MaybeNull<string>;
    total: number;
};

export type SecureLinkItem = {
    item: Item;
    expirationDate: number;
    readCount?: number;
    files: MaybeNull<{ content: FileDescriptor[]; token: string }>;
};

export type SecureLinkOptions = {
    expirationTime: number;
    maxReadCount: MaybeNull<number>;
};

export type SecureLinkCreationDTO = UniqueItem & SecureLinkOptions;
export type SecureLinkDeleteDTO = UniqueItem & { linkId: string };
export type SecureLinkQuery = { token: string; linkKey: string };

export type SecureLink = UniqueItem & {
    active: boolean;
    expirationDate: number;
    readCount: number;
    maxReadCount: MaybeNull<number>;
    linkId: string;
    secureLink: string;
};

export type ItemLinkFilesIntent = UniqueItem & { files: FileAttachmentsDTO };
export type ItemLinkFilesSuccess = { item: ItemRevision };
export type ItemRevisionLinkFiles = ItemLinkFilesIntent & { revision: number };

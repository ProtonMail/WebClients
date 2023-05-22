import type { CustomAliasCreateRequest } from '../api';
import type { ItemType } from '../protobuf';
import type { Item } from './items';

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
    alias: { mailboxes: AliasMailbox[]; aliasEmail: string };
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

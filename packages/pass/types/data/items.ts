import type { ItemIDRevision2 } from '@proton/pass/types/api/pass';
import type { OpenedItem } from '@proton/pass/types/crypto';
import type {
    ExtraFieldType,
    ItemType,
    Metadata,
    ProtobufItemAlias,
    ProtobufItemCreditCard,
    ProtobufItemIdentity,
    ProtobufItemLogin,
    ProtobufItemNote,
} from '@proton/pass/types/protobuf';
import type { ExtraField, ExtraHiddenField, ExtraTotp, PlatformSpecific } from '@proton/pass/types/protobuf/item-v1';
import type { MaybeNull, TypeMapper } from '@proton/pass/types/utils';
import type { SanitizedBuffers } from '@proton/pass/utils/buffer/sanitization';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';

type Obfuscate<T, K extends keyof T> = Omit<T, K> & { [Obf in K]: XorObfuscation };

type Deobfuscate<T> = {
    [K in keyof T]: T[K] extends XorObfuscation
        ? string
        : T[K] extends ArrayBuffer
          ? T[K]
          : T[K] extends (infer U)[]
            ? Deobfuscate<U>[]
            : T[K] extends {}
              ? Deobfuscate<T[K]>
              : T[K];
};

type ExtraFieldContent<T extends ExtraFieldType> = {
    totp: Obfuscate<ExtraTotp, 'totpUri'>;
    text: Obfuscate<ExtraHiddenField, 'content'>;
    hidden: Obfuscate<ExtraHiddenField, 'content'>;
}[T];

export type ItemContent<T extends ItemType> = {
    alias: ProtobufItemAlias;
    note: ProtobufItemNote;
    login: Obfuscate<SanitizedBuffers<ProtobufItemLogin>, 'itemEmail' | 'itemUsername' | 'password' | 'totpUri'>;
    creditCard: Obfuscate<ProtobufItemCreditCard, 'number' | 'verificationNumber' | 'pin'>;
    identity: TypeMapper<ProtobufItemIdentity, [[ExtraField, UnsafeItemExtraField]]>;
}[T];

export type UnsafeItemContent<T extends ItemType = ItemType> = Deobfuscate<ItemContent<T>>;

export type ItemExtraField<T extends ExtraFieldType = ExtraFieldType> = {
    [Key in T]: {
        fieldName: string;
        type: Key;
        data: ExtraFieldContent<Key>;
    };
}[T];

export type UnsafeItemExtraField<T extends ExtraFieldType = ExtraFieldType> = Deobfuscate<ItemExtraField<T>>;

/**
 * Derives a generic "distributive object type" over all possible
 * oneofKind keys - This will allow us to create generic functions
 * and "object mappers" over every item type derived from the original
 * protoc-gen-ts generated types
 *
 * Item types can be extended via an "Extra" type (an object type indexed
 * on ItemType keys) - this will let us create "qualified" generics over
 * the base Item type (see ./items.dto.ts for an example)
 */
export type Item<T extends ItemType = ItemType, ExtraData extends { [K in T]?: any } = never> = {
    [Key in T]: {
        type: Key;
        content: ItemContent<Key>;
        platformSpecific?: PlatformSpecific;
        extraFields: ItemExtraField[];
        metadata: Obfuscate<Metadata, 'note'>;
    } & (ExtraData[Key] extends never ? {} : { extraData: ExtraData[Key] });
}[T];

export type UnsafeItem<T extends ItemType = ItemType> = Deobfuscate<Item<T>>;

export enum ItemState {
    Active = 1,
    Trashed = 2,
}

export type ItemRevision<T extends ItemType = ItemType> = Omit<OpenedItem, 'content'> & {
    data: Item<T>;
    shareId: string;
};

export type LoginItem = ItemRevision<'login'>;

export type ItemRevisionID = ItemIDRevision2;

export type UnsafeItemRevision<T extends ItemType = ItemType> = Deobfuscate<ItemRevision<T>>;

/**
 * Adds an optimistic & failed property to
 * the ItemRevision type
 */
export type ItemRevisionWithOptimistic<T extends ItemType = ItemType> = ItemRevision<T> & {
    optimistic: boolean;
    failed: boolean;
};

/**
 * Generic utility type to construct
 * item key mappers over the different item types
 */
export type ItemMap<T> = { [type in ItemType]: T };

export type UniqueItem = { shareId: string; itemId: string };
export type SelectedItem = UniqueItem;

export type ItemSortFilter = 'recent' | 'titleASC' | 'createTimeDESC' | 'createTimeASC';
export type ItemTypeFilter = '*' | ItemType;

export type ItemFilters = {
    search: string;
    selectedShareId: MaybeNull<string>;
    sort: ItemSortFilter;
    type: ItemTypeFilter;
};

export type IndexedByShareIdAndItemId<T> = { [shareId: string]: { [itemId: string]: T } };

export type BatchItemRevisionIDs = { shareId: string; batch: ItemRevisionID[] };
export type BatchItemRevisions = { shareId: string; batch: ItemRevision[] };

export enum ItemFlag {
    SkipHealthCheck = 1 << 0,
    EmailBreached = 1 << 1,
    AliasDisabled = 1 << 2,
}

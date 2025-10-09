import type { ItemIDRevision } from '@proton/pass/types/api/pass';
import type { OpenedItem } from '@proton/pass/types/crypto';
import type { Deobfuscate, DeobfuscateMode, Obfuscate } from '@proton/pass/types/data/obfuscation';
import type {
    ExtraFieldType,
    ItemType,
    Metadata,
    ProtobufItemAlias,
    ProtobufItemCreditCard,
    ProtobufItemCustom,
    ProtobufItemIdentity,
    ProtobufItemLogin,
    ProtobufItemNote,
    ProtobufItemSSHKey,
    ProtobufItemWifi,
} from '@proton/pass/types/protobuf';
import type {
    ExtraField,
    ExtraHiddenField,
    ExtraTimestampField,
    ExtraTotp,
    PlatformSpecific,
} from '@proton/pass/types/protobuf/item-v1';
import type { MaybeNull, TypeMapper } from '@proton/pass/types/utils';
import type { SanitizedBuffers } from '@proton/pass/utils/buffer/sanitization';

type ExtraFieldContent<T extends ExtraFieldType> = {
    totp: Obfuscate<ExtraTotp, 'totpUri', never>;
    text: Obfuscate<ExtraHiddenField, 'content', never>;
    hidden: Obfuscate<ExtraHiddenField, 'content', never>;
    timestamp: Obfuscate<ExtraTimestampField, 'timestamp', never>;
}[T];

type WithSubExtraFields<T> = TypeMapper<T, [[ExtraField, DeobfuscatedItemExtraField]]>;

export type ItemContent<T extends ItemType> = {
    alias: ProtobufItemAlias;
    note: ProtobufItemNote;
    login: Obfuscate<SanitizedBuffers<ProtobufItemLogin>, 'itemEmail' | 'itemUsername' | 'totpUri', 'password'>;
    creditCard: Obfuscate<ProtobufItemCreditCard, never, 'number' | 'verificationNumber' | 'pin'>;
    identity: WithSubExtraFields<ProtobufItemIdentity>;
    sshKey: WithSubExtraFields<Obfuscate<ProtobufItemSSHKey, never, 'privateKey'>>;
    wifi: WithSubExtraFields<Obfuscate<ProtobufItemWifi, never, 'password'>>;
    custom: WithSubExtraFields<ProtobufItemCustom>;
}[T];

export type ItemExtraField<T extends ExtraFieldType = ExtraFieldType> = {
    [Key in T]: {
        fieldName: string;
        type: Key;
        data: ExtraFieldContent<Key>;
    };
}[T];

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
        metadata: Obfuscate<Metadata, 'note', never>;
    } & (ExtraData[Key] extends never ? {} : { extraData: ExtraData[Key] });
}[T];

export enum ItemState {
    Active = 1,
    Trashed = 2,
}

export type ItemRevision<T extends ItemType = ItemType> = Omit<OpenedItem, 'content'> & {
    data: Item<T>;
    shareId: string;
};

export type AliasItem = ItemRevision<'alias'>;
export type CCItem = ItemRevision<'creditCard'>;
export type IdentiyItem = ItemRevision<'identity'>;
export type LoginItem = ItemRevision<'login'>;
export type NoteItem = ItemRevision<'note'>;

export type ItemRevisionID = ItemIDRevision;
export type ItemOptimisticState = { optimistic: boolean; failed: boolean };

/**
 * Adds an optimistic & failed property to
 * the ItemRevision type
 */
export type ItemRevisionWithOptimistic<T extends ItemType = ItemType> = ItemRevision<T> & ItemOptimisticState;

/**
 * Generic utility type to construct
 * item key mappers over the different item types
 */
export type ItemMap<T> = { [type in ItemType]: T };

export type UniqueItem = { shareId: string; itemId: string };
export type SelectedShare = { shareId: string };
export type SelectedItem = UniqueItem;
export type SelectedRevision = SelectedItem & { revision: number };
export type OptimisticItem = SelectedShare & { optimisticId: string; optimisticTime?: number };

export type ItemSortFilter = 'recent' | 'titleASC' | 'createTimeDESC' | 'createTimeASC';
export type ItemTypeFilter = '*' | Exclude<ItemType, 'sshKey' | 'wifi'>;

export type ItemFilters = {
    search: string;
    selectedShareId: MaybeNull<string>;
    sort: ItemSortFilter;
    type: ItemTypeFilter;
};

export type IndexedByShareIdAndItemId<T> = Record<string, Record<string, T>>;
export type BatchItemRevisionIDs = { shareId: string; batch: ItemRevisionID[] };
export type BatchItemRevisions = { shareId: string; batch: ItemRevision[] };

export enum ItemFlag {
    SkipHealthCheck = 1 << 0,
    EmailBreached = 1 << 1,
    AliasDisabled = 1 << 2,
    HasAttachments = 1 << 3,
    HasHadAttachments = 1 << 4,
}

export type DeobfuscatedItemRevision<
    T extends ItemType = ItemType,
    Mode extends DeobfuscateMode = DeobfuscateMode,
> = Deobfuscate<ItemRevision<T>, Mode>;

export type DeobfuscatedItem<
    T extends ItemType = ItemType,
    Mode extends DeobfuscateMode = DeobfuscateMode,
> = Deobfuscate<Item<T>, Mode>;

export type DeobfuscatedItemContent<
    T extends ItemType = ItemType,
    Mode extends DeobfuscateMode = DeobfuscateMode,
> = Deobfuscate<ItemContent<T>, Mode>;

export type DeobfuscatedItemExtraField<
    T extends ExtraFieldType = ExtraFieldType,
    Mode extends DeobfuscateMode = DeobfuscateMode,
> = Deobfuscate<ItemExtraField<T>, Mode>;

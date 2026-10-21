import type { DeobfuscatedItemExtraField } from '../data/items';
import type { AutofillMode } from '../protobuf';
import type { MaybeNull } from '../utils/index';

export type UrlItem = { url: string; id: string; mode: AutofillMode };
export type UrlGroupValues = { url: string; urls: UrlItem[]; editingUrlIndex: MaybeNull<number> };

export type ExtraFieldGroupValues = { extraFields: DeobfuscatedItemExtraField[] };

export enum BitField {
    DISABLED = 0,
    ACTIVE = 1,
}

export type CustomSectionValue = { sectionName: string; sectionFields: DeobfuscatedItemExtraField[] };
export type CustomSectionGroupValues = { sections: CustomSectionValue[] };

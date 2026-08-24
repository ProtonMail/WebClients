import type { DeobfuscatedItemExtraField, MaybeNull } from '..';
import type { AutofillMode } from '../protobuf';

export type UrlItem = { url: string; id: string; mode: AutofillMode };
export type UrlGroupValues = { url: string; urls: UrlItem[]; editingUrlIndex: MaybeNull<number> };

export type ExtraFieldGroupValues = { extraFields: DeobfuscatedItemExtraField[] };

export enum BitField {
    DISABLED = 0,
    ACTIVE = 1,
}

export type CustomSectionValue = { sectionName: string; sectionFields: DeobfuscatedItemExtraField[] };
export type CustomSectionGroupValues = { sections: CustomSectionValue[] };

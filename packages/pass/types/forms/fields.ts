import type { DeobfuscatedItemExtraField } from '@proton/pass/types';

export type UrlItem = { url: string; id: string };
export type UrlGroupValues = { url: string; urls: UrlItem[] };

export type ExtraFieldGroupValues = { extraFields: DeobfuscatedItemExtraField[] };

export enum BitField {
    DISABLED = 0,
    ACTIVE = 1,
}

export type CustomSectionValue = { sectionName: string; sectionFields: DeobfuscatedItemExtraField[] };
export type CustomSectionGroupValues = { sections: CustomSectionValue[] };

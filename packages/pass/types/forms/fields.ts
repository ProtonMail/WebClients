import type { UnsafeItemExtraField } from '@proton/pass/types';

export type UrlItem = { url: string; id: string };
export type UrlGroupValues = { url: string; urls: UrlItem[] };

export type ExtraFieldGroupValues = { extraFields: UnsafeItemExtraField[] };

export enum BitField {
    DISABLED = 0,
    ACTIVE = 1,
}

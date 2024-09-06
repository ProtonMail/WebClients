import type { UniqueItem } from '@proton/pass/types/data';

export type ItemPreview = UniqueItem & { name: string };
export type LoginItemPreview = ItemPreview & { userIdentifier: string; url?: string };
export type IdentityItemPreview = ItemPreview & { fullName?: string };

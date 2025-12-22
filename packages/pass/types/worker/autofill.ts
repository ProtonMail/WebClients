import type { CCItemPreview, IdentityItemPreview, LoginItemPreview } from './data';

export type AutofillLoginResult = { items: LoginItemPreview[]; needsUpgrade: boolean };
export type AutofillIdentityResult = { items: IdentityItemPreview[]; needsUpgrade: boolean };
export type AutofillCCResult = { items: CCItemPreview[]; needsUpgrade: boolean };
export type AutofillOptions = { domain?: string; writable?: boolean };

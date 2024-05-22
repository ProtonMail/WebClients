import type { SafeLoginItem } from './data';

export type AutofillResult = { items: SafeLoginItem[]; needsUpgrade: boolean };
export type AutofillOptions = { domain?: string; writable?: boolean };

import type { SafeLoginItem } from './data';

export type AutofillResult = {
    items: SafeLoginItem[];
    needsUpgrade: boolean;
};

import type { SafeLabelCount } from '@proton/shared/lib/interfaces';

export type LocationCountMap = Partial<Record<string, SafeLabelCount>>;

export interface MailboxCounterReturn {
    loading: boolean;
    getLocationCount: (labelID: string, options?: { ignoreCategories: boolean }) => SafeLabelCount;
    getCurrentLocationCount: () => SafeLabelCount;
}

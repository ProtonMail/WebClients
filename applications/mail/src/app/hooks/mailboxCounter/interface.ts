import type { SafeLabelCount } from '@proton/shared/lib/interfaces';

export type LocationCountMap = Partial<Record<string, SafeLabelCount>>;

export interface MailboxCounterReturn {
    loading: boolean;
    counterMap: LocationCountMap;
    getLocationCount: (labelID: string) => SafeLabelCount;
    getCurrentLocationCount: () => SafeLabelCount;
}

import type { SafeLabelCount } from '@proton/shared/lib/interfaces';

export type LocationCountMap = Record<string, SafeLabelCount>;

export interface MailboxCounterReturn {
    loading: boolean;
    counterMap: LocationCountMap;
}

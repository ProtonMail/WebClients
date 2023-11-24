import type { Maybe } from '@proton/pass/types';
import { CRITERIA_MASKS, type CriteriaMasks } from '@proton/pass/types/worker/settings';

export const toggleCriteria = (setting: number, criteria: CriteriaMasks) =>
    (setting = setting ^ CRITERIA_MASKS[criteria]);

export const hasCriteria = (setting: Maybe<number>, criteria: CriteriaMasks) =>
    ((setting ?? 0) & CRITERIA_MASKS[criteria]) !== 0;

import type { Maybe } from '../../types';
import type { CriteriaMasks } from '../../types/worker/settings';
import { CRITERIA_MASKS } from '../../types/worker/settings';

export const toggleCriteria = (setting: number, criteria: CriteriaMasks) =>
    (setting = setting ^ CRITERIA_MASKS[criteria]);

export const hasCriteria = (setting: Maybe<number>, criteria: CriteriaMasks) =>
    ((setting ?? 0) & CRITERIA_MASKS[criteria]) !== 0;

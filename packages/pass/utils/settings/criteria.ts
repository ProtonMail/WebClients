import type { Maybe } from '../../types';
import type { DisallowCritera } from '../../types/worker/settings';
import { DisallowCriteriaMasks } from '../../types/worker/settings';

export const toggleCriteria = (setting: number, criteria: DisallowCritera) =>
    (setting = setting ^ DisallowCriteriaMasks[criteria]);

export const hasCriteria = (setting: Maybe<number>, criteria: DisallowCritera) =>
    ((setting ?? 0) & DisallowCriteriaMasks[criteria]) !== 0;

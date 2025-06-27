import type { DetectionRulesV1, SelectorV1 } from './v1/types';
import type { DetectionRulesV2, RuleV2 } from './v2/types';

export type DetectionRules = DetectionRulesV1 | DetectionRulesV2;
export type DetectionRulesMatch = { version: '1'; exclude: SelectorV1[] } | ({ version: '2' } & RuleV2);

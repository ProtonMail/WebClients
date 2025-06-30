import type { DetectionRulesV1, SelectorV1 } from './v1/types';
import type { DetectionRulesV2, RuleV2 } from './v2/types';

export type RuleVersion = '1' | '2';
export type Rules = DetectionRulesV1 | DetectionRulesV2;
export type Rule<V extends RuleVersion> = DetectionRules<V>['rules'][string];

export type RuleSegments<V extends RuleVersion> = Map<string, RuleNode<V>>;
export type RuleNode<V extends RuleVersion = RuleVersion> = { rule?: Rule<V>; nodes?: RuleSegments<V> };

export type DetectionRules<V extends RuleVersion = RuleVersion> = Extract<Rules, { version: V }>;
export type DetectionRulesMatch = { version: '1'; exclude: SelectorV1[] } | ({ version: '2' } & RuleV2);

export type CompiledRules<T extends RuleVersion = RuleVersion> = {
    [V in T]: { version: V; nodes: RuleSegments<V> };
}[T];

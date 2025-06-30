import type { DetectionRulesV2, RuleV2 } from '@proton/pass/lib/extension/rules/v2/types';
import { isObject } from '@proton/pass/utils/object/is-object';

/** Ideally we should validate recursively but for now
 * the JSON schema is enforced before publishing. */
export const validateRulesV2 = (data: object & { rules: unknown; version: unknown }): data is DetectionRulesV2 => {
    if (!isObject(data.rules)) return false;
    return true;
};

export const mergeRuleV2 = (a: RuleV2, b: RuleV2): RuleV2 => {
    const rule: RuleV2 = { ...a };

    if (b.exclude) rule.exclude = rule.exclude ? rule.exclude.concat(b.exclude) : b.exclude;
    if (b.include) rule.include = rule.include ? rule.include.concat(b.include) : b.include;

    return rule;
};

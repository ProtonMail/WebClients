import type { DetectionRulesV2, RuleV2 } from '@proton/pass/lib/extension/rules/v2/types';
import { isObject } from '@proton/pass/utils/object/is-object';
import { fullMerge } from '@proton/pass/utils/object/merge';

/** Ideally we should validate recursively but for now
 * the JSON schema is enforced before publishing. */
export const validateRulesV2 = (data: object & { rules: unknown; version: unknown }): data is DetectionRulesV2 => {
    if (!isObject(data.rules)) return false;
    return true;
};

/* We will always strip the trailing `/` in order to match
 * `example.com/path/` to `example.com/path` (check if still relevant)
 * Currently matches rules by exact hostname and path, with path rules
 * merged on top of hostname rules (path-specific overrides).
 *
 * TODO: Add wildcard subdomain matching for hostnames */
export const matchRulesV2 = ({ rules }: DetectionRulesV2, { hostname, pathname }: URL): RuleV2 => {
    const withPath = pathname !== '/' ? hostname + pathname.replace(/\/$/, '') : null;
    const match = rules[hostname] ?? {};
    return withPath ? fullMerge(match, rules[withPath] ?? {}) : match;
};

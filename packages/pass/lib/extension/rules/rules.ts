import type { MaybeNull } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';

import type { DetectionRules, DetectionRulesMatch } from './types';
import { matchRulesV1, validateRulesV1 } from './v1/definition';
import { matchRulesV2, validateRulesV2 } from './v2/definition';

export const getRuleVersion = (experimental: boolean): RuleVersion => (experimental ? '2' : '1');

export const validateRules = (data: unknown): data is DetectionRules => {
    if (!isObject(data)) return false;
    if (!('rules' in data && 'version' in data)) return false;

    switch (data.version) {
        case '1':
            return validateRulesV1(data);
        case '2':
            return validateRulesV2(data);
        default:
            return false;
    }
};

export const parseRules = (data: MaybeNull<string>): MaybeNull<DetectionRules> => {
    try {
        if (!data) throw new Error();
        const rules = JSON.parse(data);
        if (!validateRules(rules)) throw new Error('Invalid rules definition');
        return rules;
    } catch {
        return null;
    }
};

export const matchRules = (rules: DetectionRules, url: URL): MaybeNull<DetectionRulesMatch> => {
    switch (rules.version) {
        case '1':
            return { version: '1', exclude: matchRulesV1(rules, url) };
        case '2':
            return { version: '2', ...matchRulesV2(rules, url) };
        default:
            return null;
    }
};

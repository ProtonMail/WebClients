import type { DetectionRulesV1 } from '@proton/pass/lib/extension/rules/v1/types';

export const RULES_V1_MOCK: DetectionRulesV1 = {
    version: '1',
    rules: {
        'example.com': ['rule > host > 1', 'rule > host > 2'],
        'example.com/path': ['rule > path > 1'],
        'proton.me/path': ['rule > path > 2'],
    },
};

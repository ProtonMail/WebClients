import { isObject } from '@proton/pass/utils/object/is-object';

import type { DetectionRulesV1 } from './types';

export const validateRulesV1 = (data: object & { rules: unknown; version: unknown }): data is DetectionRulesV1 => {
    if (!isObject(data.rules)) return false;
    return Object.values(data?.rules).every(
        (value) => Array.isArray(value) && value.every((val) => typeof val === 'string')
    );
};

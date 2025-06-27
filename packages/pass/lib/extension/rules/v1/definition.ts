import { isObject } from '@proton/pass/utils/object/is-object';

import type { DetectionRulesV1, SelectorV1 } from './types';

export const validateRulesV1 = (data: object & { rules: unknown; version: unknown }): data is DetectionRulesV1 => {
    if (!isObject(data.rules)) return false;
    return Object.values(data?.rules).every(
        (value) => Array.isArray(value) && value.every((val) => typeof val === 'string')
    );
};

/* We will always strip the trailing `/` in order to match
 * `example.com/path/` to `example.com/path` */
export const matchRulesV1 = ({ rules }: DetectionRulesV1, { hostname, pathname }: URL): SelectorV1[] => {
    const withPath = pathname !== '/' ? hostname + pathname.replace(/\/$/, '') : null;
    const match = rules[hostname] ?? [];
    return withPath ? match.concat(rules[withPath] ?? []) : match;
};

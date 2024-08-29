import { WEBSITE_RULES_SUPPORTED_VERSION } from '@proton/pass/constants';
import type { ExclusionRules, MaybeNull, WebsiteRules } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';

export const validateRules = (data: unknown): data is WebsiteRules =>
    isObject(data) && 'rules' in data && 'version' in data && data.version === WEBSITE_RULES_SUPPORTED_VERSION;

export const parseRules = (data: MaybeNull<string>): MaybeNull<WebsiteRules> => {
    try {
        if (!data) throw new Error();
        const rules = JSON.parse(data);
        if (!validateRules(rules)) throw new Error();
        return rules;
    } catch {
        return null;
    }
};

/* We will always strip the trailing `/` in order to match
 * `example.com/path/` to `example.com/path` */
export const getRulesForURL = ({ rules }: WebsiteRules, { hostname, pathname }: URL): ExclusionRules => {
    const withPath = pathname !== '/' ? hostname + pathname.replace(/\/$/, '') : null;
    const match = rules[hostname] ?? [];
    return withPath ? match.concat(rules[withPath] ?? []) : match;
};

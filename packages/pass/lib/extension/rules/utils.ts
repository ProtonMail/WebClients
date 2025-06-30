import { WEBSITE_RULES_EXPERIMENTAL_URL, WEBSITE_RULES_URL } from '@proton/pass/constants';
import type { DetectionRules } from '@proton/pass/lib/extension/rules/types';
import type { Maybe } from '@proton/pass/types';
import { msToEpoch } from '@proton/pass/utils/time/epoch';

import { validateRules } from './rules';

/* Don't fetch if the rules were not modified since our last fetch */
const shouldRevalidate = async (url: string, lastRequestedAt: number): Promise<boolean> => {
    if (lastRequestedAt === 0) return true;
    const header = (await fetch(url, { method: 'HEAD' })).headers.get('Last-Modified');
    const lastModified = header ? msToEpoch(new Date(header).getTime()) : 0;

    return lastRequestedAt < lastModified;
};

export const getDetectionRules = async (options: {
    experimental: boolean;
    lastRequestedAt: number;
}): Promise<Maybe<DetectionRules>> => {
    const url = options.experimental ? WEBSITE_RULES_EXPERIMENTAL_URL : WEBSITE_RULES_URL;

    if (await shouldRevalidate(url, options.lastRequestedAt)) {
        const response: Response = await fetch(url);
        const rules = await response.json();
        if (validateRules(rules)) return rules;
    }
};

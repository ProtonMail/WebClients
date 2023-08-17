/*
 * Methods used to check if the domain or specific URL
 * is in users disallowed list
 * based on different criterias
 */
import type { DisallowedAutoDomainsSettings } from '@proton/pass/types/worker/settings';
import type { DisallowedAutoCriteria } from '@proton/pass/types/worker/settings';

export const isDisallowedUrl = (
    currentUrl: string,
    criteria: DisallowedAutoCriteria,
    disallowedUrls?: DisallowedAutoDomainsSettings
): boolean => {
    if (typeof disallowedUrls !== 'undefined' && criteria in disallowedUrls) {
        return disallowedUrls[criteria].includes(currentUrl);
    }
    return false;
};

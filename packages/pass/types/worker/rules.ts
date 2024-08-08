import type { Maybe } from '@proton/pass/types/utils';

/** Note: remember to update `WEBSITE_RULES_SUPPORTED_VERSION`
 * when changing the JSON response format */
export type WebsiteRulesJson = {
    rules: Record<string, Maybe<string[]>>;
    version: string;
};

export type CurrentWebsiteExcludeRules = WebsiteRulesJson['rules'][string];

export const isValidWebsiteRulesJson = (json: any): json is WebsiteRulesJson => 'rules' in json && 'version' in json;

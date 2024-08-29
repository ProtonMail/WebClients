export type QuerySelector = string;
export type ExclusionRules = QuerySelector[];

/** Note: remember to update `WEBSITE_RULES_SUPPORTED_VERSION`
 * when changing the JSON response format */
export type WebsiteRules = {
    rules: Record<string, ExclusionRules>;
    version: string;
};

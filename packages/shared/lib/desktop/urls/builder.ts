import { logger } from '@proton/logger';

import {
    anyPathPattern,
    buildHostnameIncludesPattern,
    buildProtonHostnamePattern,
    exactPathPattern,
    includesPathPattern,
    prefixPathPattern,
} from './regex';

export type UrlRuleFlags =
    | 'i' // case-insensitive
    | 'g' // global
    | 'm' // multiline
    | 's' // single-line
    | 'u' // Unicode
    | 'y' // sticky
    | string;

/**
 * IPC-serializable rule. The `pattern`/`flags` compile to a `RegExp` matched against
 * `${url.origin}${url.pathname}`; `searchParamsAnyOf` (when present) additionally requires at
 * least one of the named query params to be present.
 */
export type SerializedUrlRule = {
    id: string;
    pattern: string;
    regex: RegExp;
    flags: UrlRuleFlags;
    searchParamsAnyOf?: string[];
    hashParamsAnyOf?: string[];
};

class UrlRuleBuilder {
    private hostnamePattern = 'https?:\\/\\/[^\\/]*';

    private pathPattern = anyPathPattern();

    private searchParamsAnyOf?: string[];

    private hashParamsAnyOf?: string[];

    constructor(private readonly id: string) {}

    forSubdomain(subdomains: string | string[]): this {
        this.hostnamePattern = buildProtonHostnamePattern(subdomains);
        return this;
    }

    forHostnameIncluding(needle: string): this {
        this.hostnamePattern = buildHostnameIncludesPattern(needle);
        return this;
    }

    pathExact(value: string): this {
        this.pathPattern = exactPathPattern(value);
        return this;
    }

    pathPrefix(value: string): this {
        this.pathPattern = prefixPathPattern(value);
        return this;
    }

    pathIncludes(value: string): this {
        this.pathPattern = includesPathPattern(value);
        return this;
    }

    pathRegex(source: string): this {
        this.pathPattern = source;
        return this;
    }

    withAnySearchParam(names: string[]): this {
        this.searchParamsAnyOf = names;
        return this;
    }

    withAnyHashParam(names: string[]): this {
        this.hashParamsAnyOf = names;
        return this;
    }

    build(providedFlags?: UrlRuleFlags): SerializedUrlRule {
        try {
            const flags = providedFlags ?? 'i';
            const pattern = `^${this.hostnamePattern}${this.pathPattern}$`;
            const regex = new RegExp(pattern, flags);
            return {
                id: this.id,
                pattern,
                regex,
                flags,
                ...(this.searchParamsAnyOf ? { searchParamsAnyOf: this.searchParamsAnyOf } : {}),
                ...(this.hashParamsAnyOf ? { hashParamsAnyOf: this.hashParamsAnyOf } : {}),
            };
        } catch (error) {
            logger.error('Failed to build URL rule', {
                id: this.id,
                error: error instanceof Error ? error.message : String(error),
            });

            throw new Error(
                `Failed to build URL rule ${this.id}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

/**
 * Entry point for declaring a redirect rule. The terminal action method
 * (`openExternal` / `showView`) returns the serialized rule to be registered.
 *
 * @example
 * urlRule('calendar-view').forSubdomain('calendar').showView('calendar')
 */
export const urlRule = (id: string): UrlRuleBuilder => new UrlRuleBuilder(id);

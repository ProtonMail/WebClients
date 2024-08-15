import { WEBSITE_RULES_SUPPORTED_VERSION } from '@proton/pass/constants';
import type { WebsiteRules } from '@proton/pass/types';

import { getRulesForURL, parseRules, validateRules } from './website-rules';

describe('Website rules', () => {
    const rules: WebsiteRules = {
        version: WEBSITE_RULES_SUPPORTED_VERSION,
        rules: {
            'example.com': ['rule > host > 1', 'rule > host > 2'],
            'example.com/path': ['rule > path > 1'],
            'proton.me/path': ['rule > path > 2'],
        },
    };

    describe('`validateRules`', () => {
        test('returns `true` if valid object for current supported version', () => {
            expect(validateRules(rules)).toBe(true);
        });

        test('returns `false` if valid object but unsupported version', () => {
            expect(validateRules({ ...rules, version: '2' })).toBe(false);
        });

        test('returns `false` on invalid data', () => {
            expect(validateRules({})).toBe(false);
            expect(validateRules(null)).toBe(false);
            expect(validateRules(undefined)).toBe(false);
        });
    });

    describe('`parseRules`', () => {
        test('returns parsed rules', () => {
            expect(parseRules(JSON.stringify(rules))).toEqual(rules);
        });

        test('returns `null` if parsing fails', () => {
            expect(parseRules(null)).toEqual(null);
            expect(parseRules('{}')).toEqual(null);
            expect(parseRules('not-json')).toEqual(null);
            expect(parseRules(JSON.stringify({ ...rules, version: '2' }))).toEqual(null);
        });
    });

    describe('`getRulesForURL`', () => {
        test('returns hostname rules for a clean URL without path', () => {
            const result = getRulesForURL(rules, new URL('https://example.com'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2']);
        });

        test('returns hostname rules for an unclean URL without path', () => {
            const result = getRulesForURL(rules, new URL('https://example.com/#hash?search=test'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2']);
        });

        test('returns hostname & pathname rules for a clean URL with pathname', () => {
            const result = getRulesForURL(rules, new URL('https://example.com/path'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2', 'rule > path > 1']);
        });

        test('returns hostname & pathname rules for an unclean URL with pathname', () => {
            const result = getRulesForURL(rules, new URL('https://example.com/path#hash?search=test/'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2', 'rule > path > 1']);
        });

        test('returns empty array when no rules exist for the URL', () => {
            const result = getRulesForURL(rules, new URL('https://example.org'));
            expect(result).toEqual([]);
        });

        test('returns empty array if the URL has no pathname and rules exist only for the same URL with pathname', async () => {
            const result = getRulesForURL(rules, new URL('https://proton.me'));
            expect(result).toEqual([]);
        });
    });
});

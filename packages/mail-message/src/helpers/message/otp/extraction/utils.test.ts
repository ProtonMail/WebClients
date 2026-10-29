import { parse, prune } from '../preprocessing';
import {
    attributeMatches,
    dedup,
    isWordlike,
    isolatedMatch,
    joinedSiblingMatches,
    matchAll,
    oneSeparatorOnly,
} from './utils';

const doc = (html: string) => prune(parse(html));

describe('OTP extraction utils', () => {
    describe('dedup', () => {
        it('preserves order and drops duplicates and empties', () => {
            expect(dedup(['a', '', 'a', 'b', 'b', 'c'])).toEqual(['a', 'b', 'c']);
        });
    });

    describe('isWordlike', () => {
        it('treats all-lowercase as wordlike', () => {
            expect(isWordlike('hello')).toBe(true);
        });

        it('treats title-case as wordlike', () => {
            expect(isWordlike('Hello')).toBe(true);
        });

        it('treats ALLCAPS as not wordlike', () => {
            expect(isWordlike('HELLO')).toBe(false);
        });

        it('treats MixedCase as not wordlike', () => {
            expect(isWordlike('OneTime')).toBe(false);
        });

        it('treats anything with digits as not wordlike', () => {
            expect(isWordlike('abc123')).toBe(false);
            expect(isWordlike('123456')).toBe(false);
        });

        it('supports unicode letters (accented)', () => {
            expect(isWordlike('café')).toBe(true);
            expect(isWordlike('Café')).toBe(true);
        });

        it('treats a caseless script (e.g. CJK) as wordlike — no distinct upper form', () => {
            // toLowerCase() is a no-op for caseless scripts, so `s === lower`
            // returns early and the token is considered wordlike.
            expect(isWordlike('你好')).toBe(true);
        });
    });

    describe('oneSeparatorOnly', () => {
        it('keeps and strips groups with exactly one separator', () => {
            expect(oneSeparatorOnly(['123 456'])).toEqual(['123456']);
            expect(oneSeparatorOnly(['12-34'])).toEqual(['1234']);
        });

        it('drops groups with zero or two-plus separators', () => {
            expect(oneSeparatorOnly(['123456'])).toEqual([]);
            expect(oneSeparatorOnly(['1 2 3'])).toEqual([]);
        });
    });

    describe('matchAll', () => {
        it('returns capture group 1 when present', () => {
            expect(matchAll(/(\d+)x/g, '12x 34x')).toEqual(['12', '34']);
        });

        it('returns the full match when there is no capture group', () => {
            expect(matchAll(/\d+/g, '12 34')).toEqual(['12', '34']);
        });

        it('resets lastIndex on a reused global regex', () => {
            const re = /\d+/g;
            expect(matchAll(re, '12 34')).toEqual(['12', '34']);
            // A stale lastIndex would skip the first match on the second run.
            expect(matchAll(re, '12 34')).toEqual(['12', '34']);
        });

        it('terminates on a zero-length-capable pattern', () => {
            expect(matchAll(/\d*/g, 'a1b')).toContain('1');
        });
    });

    describe('isolatedMatch', () => {
        it('matches an in-range standalone code', () => {
            expect(isolatedMatch('845213')).toBe('845213');
        });

        it('joins a hyphen-split code', () => {
            expect(isolatedMatch('12-3456')).toBe('123456');
        });

        it('joins a space-split code', () => {
            expect(isolatedMatch('12 3456')).toBe('123456');
        });

        it('rejects a wordlike token', () => {
            expect(isolatedMatch('verify')).toBeNull();
        });

        it('rejects out-of-range lengths', () => {
            expect(isolatedMatch('12')).toBeNull();
            expect(isolatedMatch('12345678901')).toBeNull();
        });
    });

    describe('joinedSiblingMatches', () => {
        it('joins adjacent same-tag leaves present in the visible text', () => {
            const html = '<p><span>021</span><span>667</span></p>';
            expect(joinedSiblingMatches(doc(html), '021 667')).toEqual(['021667']);
        });

        it('rejects a candidate absent from the visible-compact text', () => {
            const html = '<p><span>021</span><span>667</span></p>';
            expect(joinedSiblingMatches(doc(html), 'nothing here')).toEqual([]);
        });

        it('skips wordlike joined runs', () => {
            const html = '<p><span>abc</span><span>def</span></p>';
            expect(joinedSiblingMatches(doc(html), 'abc def')).toEqual([]);
        });
    });

    describe('attributeMatches', () => {
        it('scans title, aria-label and alt attributes', () => {
            expect(attributeMatches(doc('<span title="code 330756">x</span>'))).toEqual(['330756']);
            expect(attributeMatches(doc('<span aria-label="330756">x</span>'))).toEqual(['330756']);
            expect(attributeMatches(doc('<span alt="330756">x</span>'))).toEqual(['330756']);
        });

        it('skips img elements', () => {
            expect(attributeMatches(doc('<img alt="123456" />'))).toEqual([]);
        });

        it('rejects wordlike attribute tokens', () => {
            expect(attributeMatches(doc('<span title="verify">x</span>'))).toEqual([]);
        });
    });
});

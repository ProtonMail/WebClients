import type { ContentKind } from '../normalize';
import { prepareBody } from '../preprocessing';
import type { Extractor } from './extractors';
import {
    bodyAttr,
    bodyCodePhrase,
    bodyColon,
    bodyEdge,
    bodyHtmlGeneral,
    bodyHtmlNum,
    bodyHyphenatedAlpha,
    bodyIsolated,
    bodyJoined,
    bodyPlainLong,
    bodyPlainShort,
    bodyPlainSplit,
    bodyVisible,
    bodyVisibleSplit,
    titleEnds,
    titleEndsHyphenated,
    titleHyphenatedAlpha,
    titleMid,
    titleSplit,
} from './extractors';

// Run a single extractor in isolation over a distilled input, deriving the shared
// body artifacts exactly as the facade does. Code values and the split/hyphenated
// formats are drawn from the real sandbox corpus; surrounding text is minimal.
const run = (extractor: Extractor, { subject = '', body = '', kind = 'html' as ContentKind }) =>
    extractor.extract({ subject, body, kind, ...prepareBody(kind, body) });

describe('OTP extractors (in isolation)', () => {
    // ---- Title extractors ----

    describe('titleEnds (title_ends_code)', () => {
        it('matches a 4–10 digit token as the last subject word', () => {
            expect(run(titleEnds, { subject: 'Your login code 123456' })).toEqual(['123456']);
        });

        it('matches a 4-digit token (e.g. "Login code 1776")', () => {
            expect(run(titleEnds, { subject: 'Login code 1776' })).toEqual(['1776']);
        });

        it('returns both ends when both are numeric', () => {
            expect(run(titleEnds, { subject: '123456 or 654321' })).toEqual(['123456', '654321']);
        });

        it('ignores digits that sit mid-subject', () => {
            expect(run(titleEnds, { subject: 'Your 123456 code today' })).toEqual([]);
        });
    });

    describe('titleMid (title_mid_code)', () => {
        it('matches a 6–10 digit token anywhere in the subject', () => {
            expect(run(titleMid, { subject: '937326 is your verification code' })).toEqual(['937326']);
        });

        it('does not match a 5-digit token', () => {
            expect(run(titleMid, { subject: 'Your code 12345 here' })).toEqual([]);
        });
    });

    describe('titleSplit (title_split_code)', () => {
        it('joins a single-separator digit group (space)', () => {
            expect(run(titleSplit, { subject: 'Your Link verification code 923 797' })).toEqual(['923797']);
        });

        it('joins a single-separator digit group (hyphen)', () => {
            expect(run(titleSplit, { subject: 'WhatsApp Verification Code 397-949' })).toEqual(['397949']);
        });

        it('drops a group with two separators', () => {
            expect(run(titleSplit, { subject: 'Pin 1 2 3' })).toEqual([]);
        });
    });

    describe('titleHyphenatedAlpha (title_hyphenated_alpha_code)', () => {
        it('joins an AAA-BBB letter token (e.g. TUK-TPF)', () => {
            expect(run(titleHyphenatedAlpha, { subject: 'Slack confirmation code: TUK-TPF' })).toEqual(['TUKTPF']);
        });

        it('does not match when a side has fewer than three letters', () => {
            expect(run(titleHyphenatedAlpha, { subject: 'Code AB-DEF' })).toEqual([]);
        });

        it('does not match lowercase', () => {
            expect(run(titleHyphenatedAlpha, { subject: 'Code abc-def' })).toEqual([]);
        });
    });

    describe('titleEndsHyphenated (title_ends_hyphenated_code)', () => {
        it('joins an edge-anchored alnum hyphenated token (e.g. QEM-77W)', () => {
            expect(run(titleEndsHyphenated, { subject: 'Slack confirmation code QEM-77W' })).toEqual(['QEM77W']);
        });

        it('does not match when the token sits mid-subject', () => {
            expect(run(titleEndsHyphenated, { subject: 'code QEM-77W now' })).toEqual([]);
        });
    });

    // ---- HTML body extractors ----

    describe('bodyHtmlNum (body_html_num_code)', () => {
        it('matches 6–10 digits between tags', () => {
            expect(run(bodyHtmlNum, { body: '<div>123456</div>' })).toEqual(['123456']);
        });

        it('matches after collapsing whitespace between tags', () => {
            expect(run(bodyHtmlNum, { body: '<div> 123456 </div>' })).toEqual(['123456']);
        });

        it('does not match a 5-digit run', () => {
            expect(run(bodyHtmlNum, { body: '<div>12345</div>' })).toEqual([]);
        });
    });

    describe('bodyHtmlGeneral (body_html_general_code)', () => {
        it('matches an alphanumeric non-wordlike token between tags', () => {
            expect(run(bodyHtmlGeneral, { body: '<div>A1B2C3</div>' })).toEqual(['A1B2C3']);
        });

        it('rejects a wordlike token between tags', () => {
            expect(run(bodyHtmlGeneral, { body: '<div>verify</div>' })).toEqual([]);
        });
    });

    describe('bodyVisible (body_visible_code)', () => {
        it('matches standalone 6–10 digits in the visible text', () => {
            expect(run(bodyVisible, { body: '<p>Your verification code is 845213</p>' })).toEqual(['845213']);
        });

        it('does not match digits embedded in a token', () => {
            expect(run(bodyVisible, { body: '<p>ab845213</p>' })).toEqual([]);
        });
    });

    describe('bodyVisibleSplit (body_visible_split_code)', () => {
        it('joins a hyphen-split visible code', () => {
            expect(run(bodyVisibleSplit, { body: '<p>12-3456</p>' })).toEqual(['123456']);
        });

        it('rejects a wordlike hyphen-split token', () => {
            expect(run(bodyVisibleSplit, { body: '<p>abc-def</p>' })).toEqual([]);
        });
    });

    describe('bodyEdge (body_edge_code)', () => {
        it('matches 6–10 digits at the start of a segment', () => {
            expect(run(bodyEdge, { body: '856134 is your code', kind: 'plain' })).toEqual(['856134']);
        });

        it('matches 6–10 digits at the end of a segment', () => {
            expect(run(bodyEdge, { body: 'your code is 856134', kind: 'plain' })).toEqual(['856134']);
        });

        it('does not match a digit run glued to letters', () => {
            expect(run(bodyEdge, { body: 'x856134', kind: 'plain' })).toEqual([]);
        });
    });

    // ---- Plaintext body extractors ----

    describe('bodyPlainLong (body_plain_long_code) — inactive (weight 0)', () => {
        it('matches standalone 6–10 digits in a plaintext body', () => {
            expect(run(bodyPlainLong, { body: 'Your code 856134', kind: 'plain' })).toEqual(['856134']);
        });

        it('only handles plaintext (returns nothing for HTML)', () => {
            expect(run(bodyPlainLong, { body: '<p>856134</p>', kind: 'html' })).toEqual([]);
        });
    });

    describe('bodyPlainSplit (body_plain_split_code) — inactive (weight 0)', () => {
        it('joins a single-separator plaintext digit group', () => {
            expect(run(bodyPlainSplit, { body: 'Code 12 3456', kind: 'plain' })).toEqual(['123456']);
        });
    });

    describe('bodyPlainShort (body_plain_short_code)', () => {
        it('matches exactly 4 standalone digits in a plaintext body', () => {
            expect(run(bodyPlainShort, { body: 'Your PIN is 1234', kind: 'plain' })).toEqual(['1234']);
        });

        it('does not match a 5-digit run', () => {
            expect(run(bodyPlainShort, { body: 'Your PIN is 12345', kind: 'plain' })).toEqual([]);
        });

        it('does not match digits embedded in a token', () => {
            expect(run(bodyPlainShort, { body: 'ref ab1234', kind: 'plain' })).toEqual([]);
        });
    });

    // ---- Kind-agnostic body extractors ----

    describe('bodyColon (body_colon_code)', () => {
        it('matches a code introduced by "<letter>: <code>"', () => {
            expect(run(bodyColon, { body: '<p>Code: 998877</p>' })).toEqual(['998877']);
        });

        it('rejects a wordlike token after the colon', () => {
            expect(run(bodyColon, { body: '<p>Step: verify</p>' })).toEqual([]);
        });

        it('accepts an accented letter (À-ÿ) before the colon', () => {
            expect(run(bodyColon, { body: '<p>café: 123456</p>' })).toEqual(['123456']);
        });
    });

    describe('bodyIsolated (body_isolated_code)', () => {
        it('matches a segment that is exactly a code', () => {
            expect(run(bodyIsolated, { body: '<div>845213</div>' })).toEqual(['845213']);
        });

        it('joins a segment that is exactly a hyphen-split code', () => {
            expect(run(bodyIsolated, { body: '<div>12-3456</div>' })).toEqual(['123456']);
        });

        it('ignores a segment containing surrounding words', () => {
            expect(run(bodyIsolated, { body: '<div>your 845213 code</div>' })).toEqual([]);
        });
    });

    describe('bodyJoined (body_joined_code)', () => {
        it('joins a code split across same-tag siblings present in visible text', () => {
            expect(run(bodyJoined, { body: '<p><span>021</span><span>667</span></p>' })).toEqual(['021667']);
        });

        it('does not join across different sibling tags', () => {
            expect(run(bodyJoined, { body: '<p><span>021</span><b>667</b></p>' })).toEqual([]);
        });

        it('skips a wordlike joined run', () => {
            expect(run(bodyJoined, { body: '<p><span>abc</span><span>def</span></p>' })).toEqual([]);
        });
    });

    describe('bodyAttr (body_attr_code)', () => {
        it('matches a code inside a title attribute', () => {
            expect(run(bodyAttr, { body: '<span title="code 330756">x</span>' })).toEqual(['330756']);
        });

        it('skips img elements', () => {
            expect(run(bodyAttr, { body: '<img alt="123456" />' })).toEqual([]);
        });

        it('rejects a wordlike attribute token', () => {
            expect(run(bodyAttr, { body: '<span title="verify">x</span>' })).toEqual([]);
        });
    });

    describe('bodyCodePhrase (body_code_phrase_code)', () => {
        it('matches a token adjacent to the word "code"', () => {
            expect(run(bodyCodePhrase, { body: '<p>code 097709</p>' })).toEqual(['097709']);
        });

        it('rejects a wordlike neighbour of "code"', () => {
            expect(run(bodyCodePhrase, { body: '<p>code verify</p>' })).toEqual([]);
        });

        it('strips punctuation off the "code" token before matching', () => {
            expect(run(bodyCodePhrase, { body: '<p>code: 097709</p>' })).toEqual(['097709']);
        });
    });

    describe('bodyHyphenatedAlpha (body_hyphenated_alpha_code) — inactive (weight 0)', () => {
        it('joins an AAA-BBB leaf element (HTML)', () => {
            expect(run(bodyHyphenatedAlpha, { body: '<div>ABC-DEF</div>' })).toEqual(['ABCDEF']);
        });

        it('joins an AAA-BBB line (plaintext)', () => {
            expect(run(bodyHyphenatedAlpha, { body: 'ABC-DEF', kind: 'plain' })).toEqual(['ABCDEF']);
        });
    });
});

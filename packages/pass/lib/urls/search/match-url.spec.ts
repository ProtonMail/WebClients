import type { ItemRevision } from '../../../types';
import { AutofillMode } from '../../../types/protobuf';
import type { AutofillUrl } from '../../../types/protobuf/item-v1';
import { getModeLabel } from '../utils/autofill';
import { autofillHelp } from '../utils/autofill.help';
import { parseUrl } from '../utils/parser';
import { ItemUrlMatch, getItemPriorityForUrl } from './match-url';

const createMockItem = (urls: string[]) =>
    ({
        itemId: 'itemId',
        data: {
            type: 'login',
            content: { autofillUrls: urls.map((url) => ({ url, mode: AutofillMode.Default })) },
        },
    }) as ItemRevision<'login'>;

const createMockItemWithMode = (autofillUrls: AutofillUrl[]) =>
    ({
        itemId: 'itemId',
        data: { type: 'login', content: { autofillUrls } },
    }) as ItemRevision<'login'>;

const options = { strict: false, regexEnabled: true };
const optionsStrict = { strict: true, regexEnabled: true };
const optionsNoRegex = { strict: false, regexEnabled: false };

describe('getItemPriorityForUrl', () => {
    describe('mode default', () => {
        test('should return `NO_MATCH` if domains do not match', () => {
            const item = createMockItem(['https://proton.ch']);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if item has no urls', () => {
            const item = createMockItem([]);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if empty domain & item has no urls', () => {
            const item = createMockItem([]);
            const result = getItemPriorityForUrl(parseUrl(''), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if item URL is a non-valid substring of domain', () => {
            const item1 = createMockItem(['https://pproton.ch']);
            const result1 = getItemPriorityForUrl(parseUrl('proton.ch'), item1, options);
            expect(result1).toBe(ItemUrlMatch.NO_MATCH);

            const item2 = createMockItem(['https://p.pproton.ch']);
            const result2 = getItemPriorityForUrl(parseUrl('proton.ch'), item2, options);
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if protocols differ', () => {
            const item1 = createMockItem(['https://proton.ch']);
            const result1 = getItemPriorityForUrl(parseUrl('http://proton.ch'), item1, options);
            expect(result1).toBe(ItemUrlMatch.NO_MATCH);

            const item2 = createMockItem(['ftp://proton.ch']);
            const result2 = getItemPriorityForUrl(parseUrl('http://proton.ch'), item2, options);
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);

            const item3 = createMockItem(['ftp://sub.proton.ch']);
            const result3 = getItemPriorityForUrl(parseUrl('http://proton.ch'), item3, options);
            expect(result3).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if ports differ', () => {
            const item1 = createMockItem(['https://proton.ch:3002']);
            const result1 = getItemPriorityForUrl(parseUrl('https://proton.ch:3001'), item1, options);
            expect(result1).toBe(ItemUrlMatch.NO_MATCH);

            const item2 = createMockItem(['ftp://proton.ch:3002']);
            const result2 = getItemPriorityForUrl(parseUrl('ftp://proton.ch:3001'), item2, options);
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);

            const item3 = createMockItem(['ftp://sub.proton.ch:3002']);
            const result3 = getItemPriorityForUrl(parseUrl('ftp://proton.ch:3001'), item3, options);
            expect(result3).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if deeper private subdomain', () => {
            const item = createMockItem(['https://a.b.c.me']);
            const result = getItemPriorityForUrl(parseUrl('b.c.me', new Set(['b.c.me'])), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` on invalid item URLs', () => {
            const item1 = createMockItem(['https::/proton.ch']);
            const item2 = createMockItem([',,,,/proton.ch', ' ']);
            const item3 = createMockItem(['', 'https://proton.me']);

            expect(getItemPriorityForUrl(parseUrl('proton.ch'), item1, options)).toBe(ItemUrlMatch.NO_MATCH);
            expect(getItemPriorityForUrl(parseUrl('proton.ch'), item2, options)).toBe(ItemUrlMatch.NO_MATCH);
            expect(getItemPriorityForUrl(parseUrl('proton.ch'), item3, options)).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` for non exact matches in strict mode', () => {
            const item2 = createMockItem(['https://a.b.example.com']);
            const result2 = getItemPriorityForUrl(parseUrl('b.example.com'), item2, optionsStrict);
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);

            const item3 = createMockItem(['https://a.example.com']);
            const result3 = getItemPriorityForUrl(parseUrl('b.example.com'), item3, optionsStrict);
            expect(result3).toBe(ItemUrlMatch.NO_MATCH);

            const item4 = createMockItem(['https://sub.example.com']);
            const result4 = getItemPriorityForUrl(parseUrl('b.example.com'), item4, optionsStrict);
            expect(result4).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain match', () => {
            const item1 = createMockItem(['https://subdomain.pm.me']);
            const result1 = getItemPriorityForUrl(parseUrl('pm.me'), item1, options);
            expect(result1).toBe(ItemUrlMatch.SUB_MATCH);

            const item2 = createMockItem(['http://nested.subdomain.pm.me']);
            const result2 = getItemPriorityForUrl(parseUrl('subdomain.pm.me'), item2, options);
            expect(result2).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain accounting for protocol', () => {
            const item = createMockItem(['http://sub.proton.ch']);
            const result = getItemPriorityForUrl(parseUrl('http://proton.ch'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain accounting for port', () => {
            const item = createMockItem(['http://sub.proton.ch:3001']);
            const result = getItemPriorityForUrl(parseUrl('http://proton.ch:3001'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain with port if no port filter', () => {
            const item = createMockItem(['http://sub.proton.ch:3001']);
            const result = getItemPriorityForUrl(parseUrl('proton.ch'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on deeper non-private subdomain matches', () => {
            const item2 = createMockItem(['https://a.b.c.me']);
            const result2 = getItemPriorityForUrl(parseUrl('b.c.me'), item2, options);
            expect(result2).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain with query parameters', () => {
            const item = createMockItem(['https://sub.example.com/path?query=param']);
            const result = getItemPriorityForUrl(parseUrl('example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `TOP_MATCH` for top level domain matching', () => {
            const item2 = createMockItem(['https://pm.me']);
            const result2 = getItemPriorityForUrl(parseUrl('a.b.pm.me'), item2, options);
            expect(result2).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `TOP_MATCH` for top level domain matching in strict mode', () => {
            const item2 = createMockItem(['https://pm.me']);
            const result2 = getItemPriorityForUrl(parseUrl('a.b.pm.me'), item2, optionsStrict);
            expect(result2).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `EXACT_MATCH` on top-level domain match', () => {
            const item1 = createMockItem(['https://pm.me']);
            const result1 = getItemPriorityForUrl(parseUrl('pm.me'), item1, options);
            expect(result1).toBe(ItemUrlMatch.EXACT_MATCH);

            const item2 = createMockItem(['nomatch', 'https://proton.ch']);
            const result2 = getItemPriorityForUrl(parseUrl('proton.ch'), item2, options);
            expect(result2).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` on top-level domain accounting for protocol', () => {
            const item = createMockItem(['ftp://proton.ch']);
            const result = getItemPriorityForUrl(parseUrl('ftp://proton.ch'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` on top-level domain accounting for port', () => {
            const item = createMockItem(['http://proton.ch:3001']);
            const result = getItemPriorityForUrl(parseUrl('http://proton.ch:3001'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` on url with port if no port filter', () => {
            const item = createMockItem(['http://proton.ch:3001']);
            const result = getItemPriorityForUrl(parseUrl('proton.ch'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` when matching by IP address', () => {
            const item1 = createMockItem(['http://192.168.1.1']);
            const result1 = getItemPriorityForUrl(parseUrl('192.168.1.1'), item1, options);
            expect(result1).toBe(ItemUrlMatch.EXACT_MATCH);

            const item2 = createMockItem(['https://192.168.1.1/path']);
            const result2 = getItemPriorityForUrl(parseUrl('192.168.1.1'), item2, options);
            expect(result2).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` on top-level domain with query parameters', () => {
            const item = createMockItem(['https://example.com/path?query=param']);
            const result = getItemPriorityForUrl(parseUrl('example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` on exact domain in strict mode', () => {
            const item1 = createMockItem(['https://example.com']);
            const result1 = getItemPriorityForUrl(parseUrl('example.com'), item1, optionsStrict);
            expect(result1).toBe(ItemUrlMatch.EXACT_MATCH);

            const item2 = createMockItem(['https://sub.example.com', 'https://example.com']);
            const result2 = getItemPriorityForUrl(parseUrl('example.com'), item2, optionsStrict);
            expect(result2).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` on deeper non-private subdomain exact matches', () => {
            const item1 = createMockItem(['https://a.b.c.me']);
            const result1 = getItemPriorityForUrl(parseUrl('a.b.c.me'), item1, options);
            expect(result1).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` on exact subdomain in strict mode', () => {
            const item = createMockItem(['https://example.com', 'https://a.example.com']);
            const result = getItemPriorityForUrl(parseUrl('a.example.com'), item, optionsStrict);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });
    });

    describe('mode strict', () => {
        test('should return `NO_MATCH` if domains do not match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.ch', mode: AutofillMode.Exact }]);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` for non exact matches', () => {
            const item = createMockItemWithMode([{ url: 'https://example.com', mode: AutofillMode.Exact }]);
            const result = getItemPriorityForUrl(parseUrl('b.example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `EXACT_MATCH` on exact subdomain', () => {
            const item = createMockItemWithMode([{ url: 'https://a.example.com', mode: AutofillMode.Exact }]);
            const result = getItemPriorityForUrl(parseUrl('a.example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });
    });

    describe('mode none', () => {
        test('should return `NO_MATCH` if domains do not match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.ch', mode: AutofillMode.Never }]);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if domains do match', () => {
            const item = createMockItemWithMode([{ url: 'https://example.com', mode: AutofillMode.Never }]);
            const result = getItemPriorityForUrl(parseUrl('example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should block when a Never entry matches alongside a positive entry', () => {
            const item = createMockItemWithMode([
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://example.com', mode: AutofillMode.Never },
            ]);
            const result = getItemPriorityForUrl(parseUrl('example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should not block a subdomain when a Never entry only matches the parent domain', () => {
            const item = createMockItemWithMode([
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://example.com', mode: AutofillMode.Never },
            ]);
            const result = getItemPriorityForUrl(parseUrl('login.example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should not block when the Never entry targets a different domain', () => {
            const item = createMockItemWithMode([
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://other.com', mode: AutofillMode.Never },
            ]);
            const result = getItemPriorityForUrl(parseUrl('example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should not block when the Never entry match a common ancerstor', () => {
            const item = createMockItemWithMode([
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://never.example.com', mode: AutofillMode.Never },
            ]);
            const result = getItemPriorityForUrl(parseUrl('login.example.com'), item, options);
            expect(result).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('blocking is scoped to the exact url, not the whole domain', () => {
            const item = createMockItemWithMode([
                { url: 'https://example.com', mode: AutofillMode.ExactPath },
                { url: 'https://example.com/logout', mode: AutofillMode.Never },
            ]);

            // different path than the Never rule: unaffected
            expect(getItemPriorityForUrl(parseUrl('https://example.com'), item, options)).toBe(
                ItemUrlMatch.EXACT_MATCH
            );

            // exact same url as the Never rule: blocked
            expect(getItemPriorityForUrl(parseUrl('https://example.com/logout'), item, options)).toBe(
                ItemUrlMatch.NO_MATCH
            );
        });

        test('a Never rule set on one url does not block a sibling positive rule on the same domain', () => {
            // regression test for the Bitwarden import case: a per-URI "never match"
            // must not veto the item's other, unrelated URIs on the same domain
            const item = createMockItemWithMode([
                { url: 'https://sso.megacorp.com/login', mode: AutofillMode.ExactPath },
                { url: 'https://sso.megacorp.com/logout', mode: AutofillMode.Never },
            ]);

            expect(getItemPriorityForUrl(parseUrl('https://sso.megacorp.com/login'), item, options)).toBe(
                ItemUrlMatch.EXACT_MATCH
            );
            expect(getItemPriorityForUrl(parseUrl('https://sso.megacorp.com/logout'), item, options)).toBe(
                ItemUrlMatch.NO_MATCH
            );
        });

        test('blocking ignores query params and hash, matching only the clean url', () => {
            const item = createMockItemWithMode([
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://example.com/logout', mode: AutofillMode.Never },
            ]);
            const result = getItemPriorityForUrl(parseUrl('https://example.com/logout?ref=abc#top'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });
    });

    describe('mode starts with', () => {
        test('should return `NO_MATCH` if domains do not match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.ch', mode: AutofillMode.StartWith }]);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if path do not match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me/pass', mode: AutofillMode.StartWith }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/drive?param=value#hash'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if sub domains match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me/pass', mode: AutofillMode.StartWith }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/drive?param=value#hash'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test("should return `NO_MATCH` even if user didn't use a trailing slash", () => {
            // proton.me stored without trailing slash from mobile
            const item = createMockItemWithMode([{ url: 'https://proton.me', mode: AutofillMode.StartWith }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me.evil.com/pass'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `TOP_MATCH` if path match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me/pass', mode: AutofillMode.StartWith }]);
            const result = getItemPriorityForUrl(
                parseUrl('https://proton.me/pass/something?param=value#hash'),
                item,
                options
            );
            expect(result).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `EXACT_MATCH` if path is an exact match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me/pass', mode: AutofillMode.StartWith }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/pass'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` if path is an exact match even without trailing slashes', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me', mode: AutofillMode.StartWith }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });
    });

    describe('mode pattern', () => {
        test('should return `NO_MATCH` if urls do not match', () => {
            const item = createMockItemWithMode([{ url: 'proton.ch', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if urls match but not pattern', () => {
            const item = createMockItemWithMode([{ url: '*.proton.me', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if single * for multiple domains', () => {
            const item = createMockItemWithMode([{ url: 'https://*.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.b.proton.me/path'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if single * for multiple paths', () => {
            const item = createMockItemWithMode([{ url: 'https://*.proton.me/*/login', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.proton.me/a/b/login'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` if url match', () => {
            const item = createMockItemWithMode([{ url: 'https://*.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.proton.me/login'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` if ** for multiple domains', () => {
            const item = createMockItemWithMode([{ url: '**.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.b.c.proton.me/path'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` if ** for multiple paths', () => {
            const item = createMockItemWithMode([{ url: '**.proton.me/**/login', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.b.c.proton.me/a/b/login'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` for a protocol-less pattern with multiple single `*` labels', () => {
            const item = createMockItemWithMode([{ url: '*.*.*.proton.me/**/login', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.b.c.proton.me/a/b/login'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` for a host-only pattern with no path', () => {
            const item = createMockItemWithMode([{ url: '**.proton.me', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.b.proton.me'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` when the pattern pins the matching protocol', () => {
            const item = createMockItemWithMode([{ url: 'https://*.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.proton.me/login'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `NO_MATCH` when the pattern pins a different protocol', () => {
            const item = createMockItemWithMode([{ url: 'https://*.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('http://a.proton.me/login'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` when `**` would reach a foreign host through the path', () => {
            const item = createMockItemWithMode([{ url: '**.acme.com', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://evil.com/x.acme.com'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` when `**` with a path would reach a foreign host', () => {
            const item = createMockItemWithMode([{ url: 'https://**.acme.com/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://evil.com/x.acme.com/path'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` on host-only subdomain wildcard (no path)', () => {
            const item = createMockItemWithMode([{ url: '**.proton.me', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.b.proton.me'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on host-only exact (no path)', () => {
            const item = createMockItemWithMode([{ url: 'proton.me', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/anything'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `NO_MATCH` when pattern pins a different protocol', () => {
            const item = createMockItemWithMode([{ url: 'https://*.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('http://a.proton.me/x'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` when pattern pins the same protocol', () => {
            const item = createMockItemWithMode([{ url: 'https://*.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://a.proton.me/x'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `NO_MATCH` when host-only pattern pins a different protocol', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('http://proton.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` when pattern is protocol-less', () => {
            const item = createMockItemWithMode([{ url: '**.proton.me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('ftp://a.proton.me/x'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `NO_MATCH`: `**` cannot reach a foreign host via the path', () => {
            const item = createMockItemWithMode([{ url: 'https://**.acme.com/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://evil.com/x.acme.com/p'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH`: `**` cannot reach a foreign host via a protocol-free pattern', () => {
            const item = createMockItemWithMode([{ url: '**.acme.com/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://evil.com/x.acme.com/p'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should preserve `**` staying broad', () => {
            const item = createMockItemWithMode([{ url: '**', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://anything.example.org'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should match the host case-insensitively (host-only pattern)', () => {
            const item = createMockItemWithMode([{ url: '*.Proton.ME', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://sub.proton.me'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should match the host case-insensitively when a path is present', () => {
            const item = createMockItemWithMode([{ url: 'HTTPS://*.Proton.Me/*', mode: AutofillMode.Pattern }]);
            const result = getItemPriorityForUrl(parseUrl('https://sub.proton.me/login'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should keep the path case-sensitive even when the host case differs', () => {
            const item = createMockItemWithMode([{ url: '*.Proton.Me/Login', mode: AutofillMode.Pattern }]);
            const matching = getItemPriorityForUrl(parseUrl('https://sub.proton.me/Login'), item, options);
            const nonMatching = getItemPriorityForUrl(parseUrl('https://sub.proton.me/login'), item, options);
            expect(matching).toBe(ItemUrlMatch.SUB_MATCH);
            expect(nonMatching).toBe(ItemUrlMatch.NO_MATCH);
        });
    });

    describe('mode regex', () => {
        test('should return `NO_MATCH` if domains do not match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.ch', mode: AutofillMode.RegularExpression }]);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if domains match but not regex', () => {
            const item = createMockItemWithMode([
                { url: 'https:\/\/proton\.me\/a+', mode: AutofillMode.RegularExpression },
            ]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/bbb'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if regex are turned of', () => {
            const item = createMockItemWithMode([
                { url: 'https:\/\/proton\.me\/a+', mode: AutofillMode.RegularExpression },
            ]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/aaa'), item, optionsNoRegex);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` if regex match', () => {
            const item = createMockItemWithMode([
                { url: 'https:\/\/proton\.me\/a+', mode: AutofillMode.RegularExpression },
            ]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/aaa'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` if regex match only the middle of the url', () => {
            const item = createMockItemWithMode([{ url: 'proton', mode: AutofillMode.RegularExpression }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/aaa'), item, options);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });
    });

    describe('mode strict path', () => {
        test('should return `NO_MATCH` if domains do not match', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.ch', mode: AutofillMode.ExactPath }]);
            const result = getItemPriorityForUrl(parseUrl('pm.me'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if domains match but not path', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me', mode: AutofillMode.ExactPath }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/path'), item, options);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `EXACT_MATCH` if domains and path matches', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me/path', mode: AutofillMode.ExactPath }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/path'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });

        test('should return `EXACT_MATCH` if domains and path matches ignoring search params and hash', () => {
            const item = createMockItemWithMode([{ url: 'https://proton.me/path', mode: AutofillMode.ExactPath }]);
            const result = getItemPriorityForUrl(parseUrl('https://proton.me/path?param=value#hash'), item, options);
            expect(result).toBe(ItemUrlMatch.EXACT_MATCH);
        });
    });

    describe('autofill examples should works as expected', () => {
        Object.entries(autofillHelp).forEach(([mode, { url: itemUrl, examples }]) => {
            examples.forEach(({ url: matchUrl, match }) => {
                it(`Mode "${getModeLabel(Number(mode))}" with ${itemUrl} should ${match ? 'match' : 'not match'} ${matchUrl}`, () => {
                    const item = createMockItemWithMode([{ url: itemUrl, mode: Number(mode) }]);
                    const result = getItemPriorityForUrl(parseUrl(matchUrl), item, options);
                    if (match) expect(result).toBeGreaterThan(ItemUrlMatch.NO_MATCH);
                    else expect(result).toBe(ItemUrlMatch.NO_MATCH);
                });
            });
        });
    });
});

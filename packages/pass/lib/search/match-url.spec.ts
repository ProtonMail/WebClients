import type { Item } from '@proton/pass/types';

import { ItemUrlMatch, getItemPriorityForUrl } from './match-url';

const createMockItem = (urls: string[]) => ({ type: 'login', content: { urls } }) as unknown as Item<'login'>;
const filter = { protocol: null, port: null, isPrivate: false };

describe('match url', () => {
    describe('`getItemPriorityForUrl`', () => {
        test('should return `NO_MATCH` if domains do not match', () => {
            const item = createMockItem(['https://proton.ch']);
            const result = getItemPriorityForUrl(item)('pm.me', filter);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if item has no urls', () => {
            const item = createMockItem([]);
            const result = getItemPriorityForUrl(item)('pm.me', filter);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if empty domain & item has no urls', () => {
            const item = createMockItem([]);
            const result = getItemPriorityForUrl(item)('', filter);
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if item URL is a non-valid substring of domain', () => {
            const item1 = createMockItem(['https://pproton.ch']);
            const result1 = getItemPriorityForUrl(item1)('proton.ch', filter);
            expect(result1).toBe(ItemUrlMatch.NO_MATCH);

            const item2 = createMockItem(['https://p.pproton.ch']);
            const result2 = getItemPriorityForUrl(item2)('proton.ch', filter);
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if protocols differ', () => {
            const item1 = createMockItem(['https://proton.ch']);
            const result1 = getItemPriorityForUrl(item1)('proton.ch', { ...filter, protocol: 'http:' });
            expect(result1).toBe(ItemUrlMatch.NO_MATCH);

            const item2 = createMockItem(['ftp://proton.ch']);
            const result2 = getItemPriorityForUrl(item2)('proton.ch', { ...filter, protocol: 'https:' });
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);

            const item3 = createMockItem(['ftp://sub.proton.ch']);
            const result3 = getItemPriorityForUrl(item3)('proton.ch', { ...filter, protocol: 'https:' });
            expect(result3).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if ports differ', () => {
            const item1 = createMockItem(['https://proton.ch:3002']);
            const result1 = getItemPriorityForUrl(item1)('proton.ch', { ...filter, port: '3001' });
            expect(result1).toBe(ItemUrlMatch.NO_MATCH);

            const item2 = createMockItem(['ftp://proton.ch:3002']);
            const result2 = getItemPriorityForUrl(item2)('proton.ch', { ...filter, port: '3001' });
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);

            const item3 = createMockItem(['ftp://sub.proton.ch:3002']);
            const result3 = getItemPriorityForUrl(item3)('proton.ch', { ...filter, port: '3001' });
            expect(result3).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` if deeper private subdomain', () => {
            const item = createMockItem(['https://a.b.c.me']);
            const result = getItemPriorityForUrl(item)('b.c.me', { ...filter, isPrivate: true });
            expect(result).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` on invalid item URLs', () => {
            const item1 = createMockItem(['https::/proton.ch']);
            const item2 = createMockItem([',,,,/proton.ch', ' ']);
            const item3 = createMockItem(['', 'https://proton.me']);

            expect(getItemPriorityForUrl(item1)('proton.ch', filter)).toBe(ItemUrlMatch.NO_MATCH);
            expect(getItemPriorityForUrl(item2)('proton.ch', filter)).toBe(ItemUrlMatch.NO_MATCH);
            expect(getItemPriorityForUrl(item3)('proton.ch', filter)).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `NO_MATCH` for non exact matches in strict mode', () => {
            const item1 = createMockItem(['https://example.com']);
            const result1 = getItemPriorityForUrl(item1)('b.example.com', { ...filter, strict: true });
            expect(result1).toBe(ItemUrlMatch.NO_MATCH);

            const item2 = createMockItem(['https://a.b.example.com']);
            const result2 = getItemPriorityForUrl(item2)('b.example.com', { ...filter, strict: true });
            expect(result2).toBe(ItemUrlMatch.NO_MATCH);

            const item3 = createMockItem(['https://a.example.com']);
            const result3 = getItemPriorityForUrl(item3)('b.example.com', { ...filter, strict: true });
            expect(result3).toBe(ItemUrlMatch.NO_MATCH);

            const item4 = createMockItem(['https://sub.example.com']);
            const result4 = getItemPriorityForUrl(item4)('b.example.com', { ...filter, strict: true });
            expect(result4).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain match', () => {
            const item1 = createMockItem(['https://subdomain.pm.me']);
            const result1 = getItemPriorityForUrl(item1)('pm.me', filter);
            expect(result1).toBe(ItemUrlMatch.SUB_MATCH);

            const item2 = createMockItem(['http://nested.subdomain.pm.me']);
            const result2 = getItemPriorityForUrl(item2)('subdomain.pm.me', filter);
            expect(result2).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain accounting for protocol', () => {
            const item = createMockItem(['http://sub.proton.ch']);
            const result = getItemPriorityForUrl(item)('proton.ch', { ...filter, protocol: 'http:' });
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain accounting for port', () => {
            const item = createMockItem(['http://sub.proton.ch:3001']);
            const result = getItemPriorityForUrl(item)('proton.ch', { ...filter, port: '3001' });
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain with port if no port filter', () => {
            const item = createMockItem(['http://sub.proton.ch:3001']);
            const result = getItemPriorityForUrl(item)('proton.ch', filter);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on deeper non-private subdomain matches', () => {
            const item1 = createMockItem(['https://a.b.c.me']);
            const result1 = getItemPriorityForUrl(item1)('a.b.c.me', filter);
            expect(result1).toBe(ItemUrlMatch.SUB_MATCH);

            const item2 = createMockItem(['https://a.b.c.me']);
            const result2 = getItemPriorityForUrl(item2)('b.c.me', filter);
            expect(result2).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on subdomain with query parameters', () => {
            const item = createMockItem(['https://sub.example.com/path?query=param']);
            const result = getItemPriorityForUrl(item)('example.com', filter);
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `SUB_MATCH` on exact subdomain in strict mode', () => {
            const item = createMockItem(['https://example.com', 'https://a.example.com']);
            const result = getItemPriorityForUrl(item)('a.example.com', { ...filter, strict: true });
            expect(result).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `TOP_MATCH` on top-level domain match', () => {
            const item1 = createMockItem(['https://pm.me']);
            const result1 = getItemPriorityForUrl(item1)('pm.me', filter);
            expect(result1).toBe(ItemUrlMatch.TOP_MATCH);

            const item2 = createMockItem(['nomatch', 'https://proton.ch']);
            const result2 = getItemPriorityForUrl(item2)('proton.ch', filter);
            expect(result2).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `TOP_MATCH` on top-level domain accounting for protocol', () => {
            const item = createMockItem(['ftp://proton.ch']);
            const result = getItemPriorityForUrl(item)('proton.ch', { ...filter, protocol: 'ftp:' });
            expect(result).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `TOP_MATCH` on top-level domain accounting for port', () => {
            const item = createMockItem(['http://proton.ch:3001']);
            const result = getItemPriorityForUrl(item)('proton.ch', { ...filter, port: '3001' });
            expect(result).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `TOP_MATCH` on url with port if no port filter', () => {
            const item = createMockItem(['http://proton.ch:3001']);
            const result = getItemPriorityForUrl(item)('proton.ch', filter);
            expect(result).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `TOP_MATCH` when matching by IP address', () => {
            const item1 = createMockItem(['http://192.168.1.1']);
            const result1 = getItemPriorityForUrl(item1)('192.168.1.1', filter);
            expect(result1).toBe(ItemUrlMatch.TOP_MATCH);

            const item2 = createMockItem(['https://192.168.1.1/path']);
            const result2 = getItemPriorityForUrl(item2)('192.168.1.1', filter);
            expect(result2).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `TOP_MATCH` on top-level domain with query parameters', () => {
            const item = createMockItem(['https://example.com/path?query=param']);
            const result = getItemPriorityForUrl(item)('example.com', filter);
            expect(result).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should return `TOP_MATCH` on exact domain in strict mode', () => {
            const item1 = createMockItem(['https://example.com']);
            const result1 = getItemPriorityForUrl(item1)('example.com', { ...filter, strict: true });
            expect(result1).toBe(ItemUrlMatch.TOP_MATCH);

            const item2 = createMockItem(['https://sub.example.com', 'https://example.com']);
            const result2 = getItemPriorityForUrl(item2)('example.com', { ...filter, strict: true });
            expect(result2).toBe(ItemUrlMatch.TOP_MATCH);
        });
    });
});

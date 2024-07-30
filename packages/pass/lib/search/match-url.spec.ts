import type { Item } from '@proton/pass/types';

import { ItemUrlMatch, getItemPriorityForUrl } from './match-url';

const createMockItem = (urls: string[]) => {
    return { type: 'login', content: { urls } } as unknown as Item<'login'>;
};

describe('match url', () => {
    describe('getItemPriorityForUrl', () => {
        test('should return `NO_MATCH` if no match', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://proton.ch']))('pm.me', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem([]))('pm.me', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem([]))('', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://pproton.ch']))('proton.ch', {
                    protocolFilter: ['https:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://p.pproton.ch']))('proton.ch', {
                    protocolFilter: ['https:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should return `SUB_MATCH` if non top-level domain match', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://subdomain.pm.me']))('pm.me', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://nested.subdomain.pm.me']))('subdomain.pm.me', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should return `TOP_MATCH` on top-level domain match', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://pm.me']))('pm.me', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['nomatch', 'https://proton.ch']))('proton.ch', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should use protocol filter', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['http://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['ftp://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['ftp://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:', 'ftp:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['http://sub.proton.ch']))('proton.ch', {
                    protocolFilter: ['http:', 'ftp:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://sub.proton.ch']))('proton.ch', {
                    protocolFilter: ['http:', 'ftp:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should match deeper subdomains if non-private', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://a.b.c.me']))('a.b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://a.b.c.me']))('b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should not match deeper subdomains if private', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://a.b.c.me']))('a.b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: true,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://a.b.c.me']))('b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: true,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should not match invalid urls', () => {
            const item1 = createMockItem(['https::/proton.ch']);
            const item2 = createMockItem([',,,,/proton.ch', ' ']);
            const item3 = createMockItem(['', 'https://proton.me']);

            expect(getItemPriorityForUrl(item1)('proton.ch', { protocolFilter: [], isPrivate: false })).toBe(
                ItemUrlMatch.NO_MATCH
            );

            expect(getItemPriorityForUrl(item2)('proton.ch', { protocolFilter: [], isPrivate: false })).toBe(
                ItemUrlMatch.NO_MATCH
            );

            expect(getItemPriorityForUrl(item3)('proton.ch', { protocolFilter: [], isPrivate: false })).toBe(
                ItemUrlMatch.NO_MATCH
            );
        });

        test('should handle IP addresses', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['http://192.168.1.1']))('192.168.1.1', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['http://192.168.1.1/path']))('192.168.1.1', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);
        });

        test('should handle URLs with ports', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://example.com:8080']))('example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://sub.example.com:8080']))('example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should handle URLs with paths and query parameters', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://example.com/path?query=param']))('example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://sub.example.com/path?query=param']))('example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.SUB_MATCH);
        });

        test('should handle strict mode', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://example.com']))('example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                    strict: true,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://example.com', 'https://a.example.com']))(
                    'a.example.com',
                    {
                        protocolFilter: [],
                        isPrivate: false,
                        strict: true,
                    }
                )
            ).toBe(ItemUrlMatch.SUB_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://example.com']))('b.example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                    strict: true,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://a.example.com']))('b.example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                    strict: true,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://sub.example.com']))('example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                    strict: true,
                })
            ).toBe(ItemUrlMatch.NO_MATCH);
        });

        test('should handle multiple URLs in an item', () => {
            expect(
                getItemPriorityForUrl(createMockItem(['https://example.com', 'https://another.com']))('example.com', {
                    protocolFilter: [],
                    isPrivate: false,
                })
            ).toBe(ItemUrlMatch.TOP_MATCH);

            expect(
                getItemPriorityForUrl(createMockItem(['https://sub.example.com', 'https://example.com']))(
                    'example.com',
                    {
                        protocolFilter: [],
                        isPrivate: false,
                    }
                )
            ).toBe(ItemUrlMatch.TOP_MATCH);
        });
    });
});

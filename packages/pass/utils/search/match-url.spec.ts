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
    });
});

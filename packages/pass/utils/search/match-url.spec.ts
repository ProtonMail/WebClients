import type { Item } from '@proton/pass/types';

import { matchLoginItemByUrl } from './match-url';

const createMockItem = (urls: string[]) => {
    return { type: 'login', content: { urls } } as unknown as Item<'login'>;
};

describe('match url', () => {
    describe('matchLoginItemByUrl', () => {
        test('should return matches if no protocol given ', () => {
            expect(matchLoginItemByUrl(createMockItem(['https://proton.ch', 'https://pm.me']))('pm.me')).toBe(true);
            expect(matchLoginItemByUrl(createMockItem(['https://proton.ch']))('pm.me')).toBe(false);
            expect(matchLoginItemByUrl(createMockItem([]))('pm.me')).toBe(false);

            expect(matchLoginItemByUrl(createMockItem(['https://proton.ch', 'https://pm.me']))('proton.ch')).toBe(true);
            expect(matchLoginItemByUrl(createMockItem(['https://proton.ch']))('proton.ch')).toBe(true);
            expect(matchLoginItemByUrl(createMockItem([]))('proton.ch')).toBe(false);
        });

        test('should match given protocol filter', () => {
            expect(
                matchLoginItemByUrl(createMockItem(['https://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:'],
                    isPrivate: false,
                })
            ).toBe(false);

            expect(
                matchLoginItemByUrl(createMockItem(['http://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:'],
                    isPrivate: false,
                })
            ).toBe(true);

            expect(
                matchLoginItemByUrl(createMockItem(['ftp://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:'],
                    isPrivate: false,
                })
            ).toBe(false);

            expect(
                matchLoginItemByUrl(createMockItem(['ftp://proton.ch']))('proton.ch', {
                    protocolFilter: ['http:', 'ftp:'],
                    isPrivate: false,
                })
            ).toBe(true);
        });

        test('should match deeper subdomains if non-private', () => {
            expect(
                matchLoginItemByUrl(createMockItem(['https://a.b.c.me']))('a.b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: false,
                })
            ).toBe(true);

            expect(
                matchLoginItemByUrl(createMockItem(['https://a.b.c.me']))('b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: false,
                })
            ).toBe(true);
        });

        test('should not match deeper subdomains if private', () => {
            expect(
                matchLoginItemByUrl(createMockItem(['https://a.b.c.me']))('a.b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: true,
                })
            ).toBe(true);

            expect(
                matchLoginItemByUrl(createMockItem(['https://a.b.c.me']))('b.c.me', {
                    protocolFilter: ['https:'],
                    isPrivate: true,
                })
            ).toBe(false);
        });

        test('should not match invalid urls', () => {
            const item1 = createMockItem(['https::/proton.ch']);
            const item2 = createMockItem([',,,,/proton.ch', ' ']);
            const item3 = createMockItem(['', 'https://proton.me']);

            expect(matchLoginItemByUrl(item1)('proton.ch')).toBe(false);
            expect(matchLoginItemByUrl(item2)('proton.ch')).toBe(false);
            expect(matchLoginItemByUrl(item3)('proton.ch')).toBe(false);
        });
    });
});

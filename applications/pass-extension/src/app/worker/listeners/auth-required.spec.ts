import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import type { ItemRevision } from '@proton/pass/types';

import { BASIC_AUTH_URL_RE, onAuthRequired } from './auth-required';

const createMockLoginItem = (username: string, password: string): ItemRevision<'login'> =>
    createTestItem('login', {
        data: itemBuilder('login').set('content', (content) =>
            content.set('itemUsername', username).set('password', password)
        ).data,
    }) as ItemRevision<'login'>;

describe('Basic auth listener', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('BASIC_AUTH_URL_RE', () => {
        describe('should match URLs with embedded credentials', () => {
            test.each([
                { url: 'http://user:pass@example.com', expected: true },
                { url: 'https://user:pass@example.com', expected: true },
                { url: 'https://user@domain.com:password@example.com', expected: true },
                { url: 'https://user!@#$%:password@example.com', expected: true },
                { url: 'https://::username::23:p@ssw0rd@api.example.com/endpoint', expected: true },
            ])('should match $url', ({ url, expected }) => {
                expect(BASIC_AUTH_URL_RE.test(url)).toBe(expected);
            });
        });

        describe('should not match URLs without credentials', () => {
            test.each([
                { url: 'https://example.com', expected: false },
                { url: 'http://example.com/path', expected: false },
                { url: 'https://user@example.com', expected: false },
                { url: 'ftp://user:pass@example.com', expected: false },
                { url: 'ssh://user:pass@example.com', expected: false },
            ])('should not match $url', ({ url, expected }) => {
                expect(BASIC_AUTH_URL_RE.test(url)).toBe(expected);
            });
        });
    });

    describe('onAuthRequired', () => {
        describe('URL validation', () => {
            it('should cancel when URL already contains embedded credentials', () => {
                const items = [createMockLoginItem('::username::', '::password::')];
                const url = 'https://user:pass@example.com';
                const result = onAuthRequired({ items, url, attempt: 0 });

                expect(result).toEqual({ cancel: false });
            });

            it('should cancel when URL contains credentials with special characters', () => {
                const items = [createMockLoginItem('::username::', '::password::')];
                const url = 'https://::username::23:p@ssw0rd@api.example.com/endpoint';
                const result = onAuthRequired({ items, url, attempt: 0 });

                expect(result).toEqual({ cancel: false });
            });

            it('should not cancel for URLs without embedded credentials', () => {
                const items = [createMockLoginItem('::username::', '::password::')];
                const url = 'https://example.com';
                const result = onAuthRequired({ items, url, attempt: 0 });

                expect(result).not.toEqual({ cancel: false });
                expect(result).toHaveProperty('authCredentials');
            });
        });

        describe('Items validation', () => {
            it('should cancel when no items are provided', () => {
                const items: ItemRevision<'login'>[] = [];
                const url = 'https://example.com';

                const result = onAuthRequired({ items, url, attempt: 0 });
                expect(result).toEqual({ cancel: false });
            });
        });

        describe('Request attempt limiting', () => {
            it('should return first item on first attempt', () => {
                const items = [
                    createMockLoginItem('::username::', '::password::'),
                    createMockLoginItem('::username-2::', '::password-2::'),
                ];
                const url = 'https://example.com';
                const attempt = 0;

                const result = onAuthRequired({ items, url, attempt });

                expect(result).toEqual({
                    authCredentials: {
                        username: '::username::',
                        password: '::password::',
                    },
                });
            });

            it('should cancel when attempts exceed number of items', () => {
                const items = [
                    createMockLoginItem('::username::', '::password::'),
                    createMockLoginItem('::username-2::', '::password-2::'),
                ];
                const url = 'https://example.com';
                const result = onAuthRequired({ items, url, attempt: 2 });

                expect(result).toEqual({ cancel: false });
            });
        });
    });
});

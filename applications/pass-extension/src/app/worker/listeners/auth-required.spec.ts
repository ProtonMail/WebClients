import type { Mock } from 'vitest';
import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemRevision } from '@proton/pass/types/data/items';
import { createTestItem } from '@proton/pass/utils/tests/fixtures/items';

import { WorkerContext } from '../context/inject';
import { BASIC_AUTH_URL_RE, createBasicAuthController, resolveCredentials } from './auth-required';

const createMockLoginItem = (username: string, password: string): ItemRevision<'login'> =>
    createTestItem('login', {
        data: itemBuilder('login').set('content', (content) =>
            content.set('itemUsername', username).set('password', password)
        ).data,
    }) as ItemRevision<'login'>;

describe('Basic auth listener', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    describe('resolveCredentials', () => {
        describe('URL validation', () => {
            it('should cancel when URL already contains embedded credentials', () => {
                const items = [createMockLoginItem('::username::', '::password::')];
                const url = 'https://user:pass@example.com';
                const result = resolveCredentials({ items, url, attempt: 0 });

                expect(result).toEqual({ cancel: false });
            });

            it('should cancel when URL contains credentials with special characters', () => {
                const items = [createMockLoginItem('::username::', '::password::')];
                const url = 'https://::username::23:p@ssw0rd@api.example.com/endpoint';
                const result = resolveCredentials({ items, url, attempt: 0 });

                expect(result).toEqual({ cancel: false });
            });

            it('should not cancel for URLs without embedded credentials', () => {
                const items = [createMockLoginItem('::username::', '::password::')];
                const url = 'https://example.com';
                const result = resolveCredentials({ items, url, attempt: 0 });

                expect(result).not.toEqual({ cancel: false });
                expect(result).toHaveProperty('authCredentials');
            });
        });

        describe('Items validation', () => {
            it('should cancel when no items are provided', () => {
                const items: ItemRevision<'login'>[] = [];
                const url = 'https://example.com';

                const result = resolveCredentials({ items, url, attempt: 0 });
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

                const result = resolveCredentials({ items, url, attempt });

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
                const result = resolveCredentials({ items, url, attempt: 2 });

                expect(result).toEqual({ cancel: false });
            });
        });
    });

    describe('onAuthRequired', () => {
        const savedLogins = [
            createMockLoginItem('::username::', '::password::'),
            createMockLoginItem('::username-2::', '::password-2::'),
        ];

        let onAuthRequired: (details: Partial<WebRequest.OnAuthRequiredDetailsType>) => WebRequest.BlockingResponse;

        const pageLoadAsksForLogin = (isProxy: boolean) =>
            onAuthRequired({ requestId: '1', url: 'https://intranet.example.com/', type: 'main_frame', isProxy });

        const siteAsksForLogin = () => pageLoadAsksForLogin(false);
        const proxyAsksForLogin = () => pageLoadAsksForLogin(true);

        beforeEach(async () => {
            WorkerContext.set({
                getState: () => ({ authorized: true }),
                service: {
                    autofill: { getLoginCandidates: () => savedLogins },
                    store: { getState: () => ({ settings: { autofill: { basicAuth: true } } }) },
                },
            } as any);

            createBasicAuthController().listen();
            const addListener = browser.webRequest.onAuthRequired.addListener as Mock;
            await vi.waitFor(() => expect(addListener).toHaveBeenCalled());
            onAuthRequired = addListener.mock.lastCall?.[0];
        });

        afterEach(() => WorkerContext.clear());

        it('should fill the saved login when the site asks for it', () => {
            expect(siteAsksForLogin()).toEqual({
                authCredentials: { username: '::username::', password: '::password::' },
            });
        });

        it('should not fill a saved login when a proxy asks for credentials', () => {
            expect(proxyAsksForLogin()).toEqual({ cancel: false });
        });

        it('should start from the first saved login when the site asks after the proxy', () => {
            proxyAsksForLogin();

            expect(siteAsksForLogin()).toEqual({
                authCredentials: { username: '::username::', password: '::password::' },
            });
        });
    });
});

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import * as itemUtils from '@proton/pass/lib/items/item.utils';
import type { ItemRevision } from '@proton/pass/types';
import * as deobfuscateModule from '@proton/pass/utils/obfuscate/xor';

import { onAuthRequired } from './auth-required';

const mockIntoUserIdentifier = jest.spyOn(itemUtils, 'intoUserIdentifier');
const mockDeobfuscate = jest.spyOn(deobfuscateModule, 'deobfuscate');
const mockObfuscate = jest.spyOn(deobfuscateModule, 'obfuscate');

// Mock setTimeout to avoid actual delays in tests
jest.useFakeTimers();

const createMockLoginItem = (username: string, password: string): ItemRevision<'login'> =>
    createTestItem('login', {
        data: itemBuilder('login').set('content', (content) =>
            content.set('itemUsername', username).set('password', password)
        ).data,
    }) as ItemRevision<'login'>;

describe('onAuthRequired', () => {
    beforeAll(() => {
        mockIntoUserIdentifier.mockImplementation(() => '::username::');
        mockDeobfuscate.mockImplementation(() => '::password::');
        mockObfuscate.mockImplementation(() => ({ m: '::m::', v: '::v::' }));
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
    });

    describe('URL validation', () => {
        it('should cancel when URL already contains embedded credentials', () => {
            const items = [createMockLoginItem('::username::', '::password::')];
            const url = 'https://user:pass@example.com';
            const requestId = 'req1';

            const result = onAuthRequired({ items, url, requestId });

            expect(result).toEqual({ cancel: false });
            expect(mockIntoUserIdentifier).not.toHaveBeenCalled();
            expect(mockDeobfuscate).not.toHaveBeenCalled();
        });

        it('should cancel when URL contains credentials with special characters', () => {
            const items = [createMockLoginItem('::username::', '::password::')];
            const url = 'https://::username::23:p@ssw0rd@api.example.com/endpoint';
            const requestId = 'req1';

            const result = onAuthRequired({ items, url, requestId });

            expect(result).toEqual({ cancel: false });
        });

        it('should not cancel for URLs without embedded credentials', () => {
            const items = [createMockLoginItem('::username::', '::password::')];
            const url = 'https://example.com';
            const requestId = 'req1';

            const result = onAuthRequired({ items, url, requestId });

            expect(result).not.toEqual({ cancel: false });
            expect(result).toHaveProperty('authCredentials');
        });
    });

    describe('Items validation', () => {
        it('should cancel when no items are provided', () => {
            const items: ItemRevision<'login'>[] = [];
            const url = 'https://example.com';
            const requestId = 'req1';

            const result = onAuthRequired({ items, url, requestId });

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
            const requestId = 'req1';

            const result = onAuthRequired({ items, url, requestId });

            expect(result).toEqual({
                authCredentials: {
                    username: '::username::',
                    password: '::password::',
                },
            });
            expect(mockIntoUserIdentifier).toHaveBeenCalledWith(items[0]);
            expect(mockDeobfuscate).toHaveBeenCalledWith({ m: '::m::', v: '::v::' });
        });

        it('should cancel when attempts exceed number of items', () => {
            const items = [
                createMockLoginItem('::username::', '::password::'),
                createMockLoginItem('::username-2::', '::password-2::'),
            ];
            const url = 'https://example.com';
            const requestId = 'req1';

            // First attempt
            onAuthRequired({ items, url, requestId });
            // Second attempt
            onAuthRequired({ items, url, requestId });

            // Third attempt should be cancelled
            const result = onAuthRequired({ items, url, requestId });

            expect(result).toEqual({ cancel: false });
        });

        it('should handle different requestIds independently', () => {
            const items = [createMockLoginItem('::username::', '::password::')];
            const url = 'https://example.com';

            // First request
            const result1 = onAuthRequired({ items, url, requestId: 'req1' });
            // Second request with different ID
            const result2 = onAuthRequired({ items, url, requestId: 'req2' });

            expect(result1).toEqual({
                authCredentials: {
                    username: '::username::',
                    password: '::password::',
                },
            });
            expect(result2).toEqual({
                authCredentials: {
                    username: '::username::',
                    password: '::password::',
                },
            });
        });
    });

    describe('Timeout cleanup', () => {
        it('should clear requestId from Map after 2 seconds', () => {
            const items = [createMockLoginItem('::username::', '::password::')];
            const url = 'https://example.com';
            const requestId = 'req1';

            // Make initial request
            onAuthRequired({ items, url, requestId });

            // Fast-forward time by 2 seconds
            jest.advanceTimersByTime(2000);

            // Make request again - should start from first item again
            const result = onAuthRequired({ items, url, requestId });

            expect(result).toEqual({
                authCredentials: {
                    username: '::username::',
                    password: '::password::',
                },
            });
        });
    });
});

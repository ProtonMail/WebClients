import { describe, expect, it } from '@jest/globals';

import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { moveIdToTop, updateSubscriptionState } from './newsletterSubscriptionsReducers.helpers';

describe('newsletterSubscriptions reducers helpers', () => {
    describe('moveIdToTop', () => {
        it('should move an existing ID to the top', () => {
            const list = ['a', 'b', 'c', 'd'];
            expect(moveIdToTop(list, 'c')).toEqual(['c', 'a', 'b', 'd']);
        });

        it('should add the ID to the top if not present', () => {
            const list = ['a', 'b', 'c'];
            expect(moveIdToTop(list, 'z')).toEqual(['z', 'a', 'b', 'c']);
        });

        it('should keep the list unchanged if the ID is already at the top', () => {
            const list = ['x', 'y', 'z'];
            expect(moveIdToTop(list, 'x')).toEqual(['x', 'y', 'z']);
        });

        it('should work with an empty list', () => {
            expect(moveIdToTop([], 'foo')).toEqual(['foo']);
        });
    });

    describe('updateSubscriptionState', () => {
        it('should update the state with the new values', () => {
            const byId = {
                '1': { ID: '1', Name: 'Test' } as NewsletterSubscription,
            } as Record<string, NewsletterSubscription>;

            updateSubscriptionState(byId, '1', {
                Name: 'Test 2',
            });

            expect(byId['1']).toEqual({ ID: '1', Name: 'Test 2' });
        });

        it('should create a new entry if the ID is not present', () => {
            const byId = {} as Record<string, NewsletterSubscription>;

            updateSubscriptionState(byId, '1', {
                Name: 'Test 2',
            });

            expect(byId['1']).toEqual({ ID: '1', Name: 'Test 2' });
        });
    });
});

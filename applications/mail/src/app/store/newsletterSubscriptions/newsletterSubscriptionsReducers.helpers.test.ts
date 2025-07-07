import { describe, expect, it } from '@jest/globals';

import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { UpdateEventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { SortSubscriptionsValue } from './interface';
import {
    handleUpdateServerEvent,
    moveIdToTop,
    updateSubscriptionState,
} from './newsletterSubscriptionsReducers.helpers';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

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

    describe('handleUpdateServerEvent', () => {
        it('should update the existing subscription', () => {
            const mockState = {
                value: {
                    byId: {
                        '1': { ID: '1', Name: 'Test', UnsubscribedTime: 0 } as NewsletterSubscription,
                    },
                    tabs: {
                        active: {
                            ids: ['1'],
                            totalCount: 1,
                            sorting: SortSubscriptionsValue.RecentlyReceived,
                            loading: false,
                            paginationQueryString: null,
                        },
                        unsubscribe: {
                            ids: [],
                            totalCount: 0,
                            sorting: SortSubscriptionsValue.RecentlyReceived,
                            loading: false,
                            paginationQueryString: null,
                        },
                    },
                    selectedTab: 'active',
                    selectedSubscriptionId: '1',
                    selectedElementId: undefined,
                    unsubscribingSubscriptionId: undefined,
                },
                error: undefined,
                meta: {
                    fetchedAt: 0,
                    fetchedEphemeral: true,
                },
            } as NewsletterSubscriptionsStateType;

            const update: UpdateEventItemUpdate<NewsletterSubscription, 'NewsletterSubscription'> = {
                ID: '1',
                Action: EVENT_ACTIONS.UPDATE,
                NewsletterSubscription: {
                    ID: '1',
                    Name: 'Updated Test',
                    UnsubscribedTime: 0,
                } as NewsletterSubscription,
            };

            handleUpdateServerEvent(mockState, update);

            expect(mockState.value?.byId['1']).toEqual({
                ID: '1',
                Name: 'Updated Test',
                UnsubscribedTime: 0,
            });
        });

        it('should create a new subscription if it does not exist', () => {
            const mockState = {
                value: {
                    byId: {},
                    tabs: {
                        active: {
                            ids: [],
                            totalCount: 0,
                            sorting: SortSubscriptionsValue.RecentlyReceived,
                            loading: false,
                            paginationQueryString: null,
                        },
                        unsubscribe: {
                            ids: [],
                            totalCount: 0,
                            sorting: SortSubscriptionsValue.RecentlyReceived,
                            loading: false,
                            paginationQueryString: null,
                        },
                    },
                    selectedTab: 'active',
                    selectedSubscriptionId: undefined,
                    selectedElementId: undefined,
                    unsubscribingSubscriptionId: undefined,
                },
                error: undefined,
                meta: {
                    fetchedAt: 0,
                    fetchedEphemeral: true,
                },
            } as NewsletterSubscriptionsStateType;

            const update: UpdateEventItemUpdate<NewsletterSubscription, 'NewsletterSubscription'> = {
                ID: '1',
                Action: EVENT_ACTIONS.UPDATE,
                NewsletterSubscription: { ID: '1', Name: 'New Test', UnsubscribedTime: 0 } as NewsletterSubscription,
            };

            handleUpdateServerEvent(mockState, update);

            expect(mockState.value?.byId['1']).toEqual({
                ID: '1',
                Name: 'New Test',
                UnsubscribedTime: 0,
            });
            expect(mockState.value?.tabs.active.ids).toEqual(['1']);
            expect(mockState.value?.tabs.active.totalCount).toBe(1);
        });
    });
});

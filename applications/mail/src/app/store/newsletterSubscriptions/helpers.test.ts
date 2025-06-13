import { describe, expect, it } from '@jest/globals';

import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { DEFAULT_PAGINATION_PAGE_SIZE, DEFAULT_SORTING } from './constants';
import {
    getFilteredPaginationData,
    getPaginationDataFromNextPage,
    getSortParams,
    getTabData,
    moveIdToTop,
    normalizeSubscriptions,
} from './helpers';
import { SortSubscriptionsValue } from './interface';

describe('newsletterSubscriptions helpers', () => {
    describe('normalizeSubscriptions', () => {
        it('should return empty objects when given empty array', () => {
            const result = normalizeSubscriptions([]);
            expect(result).toEqual({ byId: {}, ids: [] });
        });

        it('should properly normalize an array of subscriptions', () => {
            const subscriptions: NewsletterSubscription[] = [
                { ID: '1', Name: 'Sub1' } as NewsletterSubscription,
                { ID: '2', Name: 'Sub2' } as NewsletterSubscription,
                { ID: '3', Name: 'Sub3' } as NewsletterSubscription,
            ];

            const expected = {
                byId: {
                    '1': { ID: '1', Name: 'Sub1' },
                    '2': { ID: '2', Name: 'Sub2' },
                    '3': { ID: '3', Name: 'Sub3' },
                },
                ids: ['1', '2', '3'],
            };

            const result = normalizeSubscriptions(subscriptions);
            expect(result).toEqual(expected);
        });
    });

    describe('getPaginationDataFromNextPage', () => {
        it('should return undefined when nextPage is null', () => {
            const result = getPaginationDataFromNextPage('1', null);
            expect(result).toBeUndefined();
        });

        it('should return pagination data with defaults when values are missing', () => {
            const nextPage = {
                Pagination: {} as any,
            };

            const result = getPaginationDataFromNextPage('1', nextPage);

            expect(result).toEqual({
                Active: '1',
                PageSize: DEFAULT_PAGINATION_PAGE_SIZE,
                AnchorID: '',
                AnchorLastReceivedTime: null,
                AnchorUnreadMessageCount: null,
            });
        });

        it('should return correct pagination data with provided values', () => {
            const nextPage = {
                Pagination: {
                    AnchorID: 'anchor123',
                    AnchorLastReceivedTime: '2023-01-01T12:00:00Z',
                } as any,
            };

            const result = getPaginationDataFromNextPage('0', nextPage);

            expect(result).toEqual({
                Active: '0',
                PageSize: DEFAULT_PAGINATION_PAGE_SIZE,
                AnchorID: 'anchor123',
                AnchorLastReceivedTime: '2023-01-01T12:00:00Z',
                AnchorUnreadMessageCount: null,
            });
        });
    });

    describe('getTabData', () => {
        it('should return default tab data with provided values', () => {
            const ids = ['1', '2', '3'];
            const apiData: GetNewsletterSubscriptionsApiResponse = {
                NewsletterSubscriptions: [],
                PageInfo: {
                    Total: 42,
                    NextPage: null,
                },
            };

            const result = getTabData(ids, apiData);

            expect(result).toEqual({
                ids,
                loading: false,
                sorting: DEFAULT_SORTING,
                totalCount: 42,
                paginationData: undefined,
            });
        });

        it('should use provided loading and sorting values', () => {
            const ids = ['1', '2'];
            const apiData: GetNewsletterSubscriptionsApiResponse = {
                NewsletterSubscriptions: [],
                PageInfo: {
                    Total: 5,
                    NextPage: null,
                },
            };
            const loading = true;

            const result = getTabData(ids, apiData, loading, SortSubscriptionsValue.Alphabetical);

            expect(result).toEqual({
                ids,
                loading: true,
                sorting: SortSubscriptionsValue.Alphabetical,
                totalCount: 5,
                paginationData: undefined,
            });
        });

        it('should include pagination data when NextPage is present', () => {
            const ids = ['1'];
            const apiData: GetNewsletterSubscriptionsApiResponse = {
                NewsletterSubscriptions: [],
                PageInfo: {
                    Total: 10,
                    NextPage: {
                        Pagination: {
                            AnchorID: 'next-anchor',
                            AnchorLastReceivedTime: '2023-05-01T00:00:00Z',
                        } as any,
                    },
                },
            };

            const result = getTabData(ids, apiData);

            expect(result).toEqual({
                ids,
                loading: false,
                sorting: DEFAULT_SORTING,
                totalCount: 10,
                paginationData: {
                    Active: '1',
                    PageSize: DEFAULT_PAGINATION_PAGE_SIZE,
                    AnchorID: 'next-anchor',
                    AnchorLastReceivedTime: '2023-05-01T00:00:00Z',
                    AnchorUnreadMessageCount: null,
                },
            });
        });
    });

    describe('getSortParams', () => {
        it('should return undefined when no sort option is provided', () => {
            const result = getSortParams();
            expect(result).toBeUndefined();
        });

        it('should return last-read sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.LastRead);
            expect(result).toEqual({
                'Sort[UnreadMessageCount]': 'ASC',
            });
        });

        it('should return most-read sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.MostRead);
            expect(result).toEqual({
                'Sort[UnreadMessageCount]': 'DESC',
            });
        });

        it('should return alphabetical sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.Alphabetical);
            expect(result).toEqual({
                'Sort[Name]': 'ASC',
            });
        });

        it('should return recently-received sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.RecentlyReceived);
            expect(result).toEqual({
                'Sort[LastReceivedTime]': 'DESC',
            });
        });

        it('should return undefined for unhandled sort option', () => {
            const result = getSortParams('most-frequent' as any);
            expect(result).toBeUndefined();
        });
    });

    describe('getFilteredPaginationData', () => {
        it('should return empty object when no pagination data is provided', () => {
            const result = getFilteredPaginationData(undefined);
            expect(result).toEqual({});
        });

        it('should return filtered pagination data', () => {
            const paginationData = {
                PageSize: 10,
                AnchorID: '123',
                AnchorLastReceivedTime: 'some-timestamp',
            };

            const result = getFilteredPaginationData(paginationData);
            expect(result).toEqual(paginationData);
        });

        it('should return filtered pagination data with null values', () => {
            const paginationData = {
                PageSize: 10,
                AnchorID: '123',
                AnchorLastReceivedTime: null,
            };

            const result = getFilteredPaginationData(paginationData);
            expect(result).toEqual({
                PageSize: 10,
                AnchorID: '123',
            });
        });

        it('should return filtered pagination data with 0 count', () => {
            const paginationData = {
                PageSize: 10,
                AnchorID: '123',
                AnchorLastReceivedTime: 0,
            };

            const result = getFilteredPaginationData(paginationData);
            expect(result).toEqual({
                PageSize: 10,
                AnchorID: '123',
                AnchorLastReceivedTime: 0,
            });
        });
    });

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
});

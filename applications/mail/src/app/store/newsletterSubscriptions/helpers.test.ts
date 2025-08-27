import { describe, expect, it } from '@jest/globals';

import type {
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { DEFAULT_SORTING } from './constants';
import { getSortParams, getTabData, normalizeSubscriptions } from './helpers';
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

    describe('getTabData', () => {
        it('should return default tab data with provided values', () => {
            const ids = ['1', '2', '3'];
            const apiData: GetNewsletterSubscriptionsApiResponse = {
                NewsletterSubscriptions: [],
                PageInfo: {
                    Total: 42,
                    NextPage: {
                        QueryString: null,
                    },
                },
            };

            const result = getTabData(ids, apiData);

            expect(result).toEqual({
                ids,
                loading: false,
                sorting: DEFAULT_SORTING,
                totalCount: 42,
                paginationQueryString: null,
            });
        });

        it('should use provided loading and sorting values', () => {
            const ids = ['1', '2'];
            const apiData: GetNewsletterSubscriptionsApiResponse = {
                NewsletterSubscriptions: [],
                PageInfo: {
                    Total: 5,
                    NextPage: {
                        QueryString: null,
                    },
                },
            };
            const loading = true;

            const result = getTabData(ids, apiData, loading, SortSubscriptionsValue.Alphabetical);

            expect(result).toEqual({
                ids,
                loading: true,
                sorting: SortSubscriptionsValue.Alphabetical,
                totalCount: 5,
                paginationQueryString: null,
            });
        });

        it('should include pagination data when NextPage is present', () => {
            const ids = ['1'];
            const apiData: GetNewsletterSubscriptionsApiResponse = {
                NewsletterSubscriptions: [],
                PageInfo: {
                    Total: 10,
                    NextPage: {
                        QueryString: 'next-anchor',
                    },
                },
            };

            const result = getTabData(ids, apiData);

            expect(result).toEqual({
                ids,
                loading: false,
                sorting: DEFAULT_SORTING,
                totalCount: 10,
                paginationQueryString: 'next-anchor',
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
            expect(result).toEqual('Sort[UnreadMessageCount]=ASC');
        });

        it('should return most-read sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.MostRead);
            expect(result).toEqual('Sort[UnreadMessageCount]=DESC');
        });

        it('should return alphabetical sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.Alphabetical);
            expect(result).toEqual('Sort[Name]=ASC');
        });

        it('should return recently-received sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.RecentlyReceived);
            expect(result).toEqual('Sort[LastReceivedTime]=DESC');
        });

        it('should return most-frequent sort parameters', () => {
            const result = getSortParams(SortSubscriptionsValue.MostFrequent);
            expect(result).toEqual('Sort[MostFrequent]=DESC');
        });

        it('should return undefined when no sort option is provided', () => {
            const result = getSortParams();
            expect(result).toBeUndefined();
        });
    });
});

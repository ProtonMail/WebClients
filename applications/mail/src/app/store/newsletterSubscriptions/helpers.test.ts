import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { formatSubscriptionResponse, updateSubscriptionKeysIfCorrectID } from './helpers';

const subscription: NewsletterSubscription = {
    ID: 'subscription-123',
    UserId: 'user-123',
    AddressId: 'address-123',
    ListId: 'list-123',
    SenderAddress: 'sender@example.com',
    BimiSelector: 'selector-123',
    Name: 'Old Name',
    UnsubscribedTime: 0,
    FirstReceivedTime: '2023-01-01T00:00:00Z',
    LastReceivedTime: '2023-01-10T00:00:00Z',
    LastReadTime: '2023-01-09T00:00:00Z',
    ReceivedMessageCount: 10,
    UnreadMessageCount: 5,
    TrackersCount: 3,
    MarkAsRead: false,
    MoveToFolder: 'inbox',
};

const secondSubscription: NewsletterSubscription = {
    ID: 'subscription-456',
    UserId: 'user-456',
    AddressId: 'address-456',
    ListId: 'list-456',
    SenderAddress: 'sender@example.com',
    BimiSelector: 'selector-456',
    Name: 'Test Name',
    UnsubscribedTime: 0,
    FirstReceivedTime: '2023-01-01T00:00:00Z',
    LastReceivedTime: '2023-01-10T00:00:00Z',
    LastReadTime: '2023-01-09T00:00:00Z',
    ReceivedMessageCount: 10,
    UnreadMessageCount: 5,
    TrackersCount: 3,
    MarkAsRead: false,
    MoveToFolder: 'inbox',
};

describe('Mail subscription slice helpers', () => {
    describe('updateSubscriptionKeysIfCorrectID', () => {
        it('should update the subscription when ID matches', () => {
            const keys: Partial<NewsletterSubscription> = {
                Name: 'New Name',
                SenderAddress: 'new-sender@example.com',
                MarkAsRead: true,
            };

            expect(
                updateSubscriptionKeysIfCorrectID({
                    idToUpdate: subscription.ID,
                    subscription,
                    keys,
                })
            ).toStrictEqual({
                ...subscription,
                ...keys,
            });
        });

        it('should not update the subscription when ID does not match', () => {
            const keys: Partial<NewsletterSubscription> = {
                Name: 'New Name',
                SenderAddress: 'new-sender@example.com',
                MarkAsRead: true,
            };

            expect(
                updateSubscriptionKeysIfCorrectID({
                    idToUpdate: 'subscription-123',
                    subscription: secondSubscription,
                    keys,
                })
            ).toBe(secondSubscription);
        });

        it('should handle updating UnsubscribedTime property', () => {
            const keys: Partial<NewsletterSubscription> = {
                UnsubscribedTime: 987654321,
            };

            expect(
                updateSubscriptionKeysIfCorrectID({
                    idToUpdate: 'subscription-123',
                    subscription,
                    keys,
                })
            ).toStrictEqual({
                ...subscription,
                ...keys,
            });
        });

        it('should handle updating multiple properties at once', () => {
            const keys: Partial<NewsletterSubscription> = {
                SenderAddress: 'updated@example.com',
                UnsubscribedTime: 987654321,
                Name: 'Updated Name',
                MarkAsRead: true,
                MoveToFolder: 'spam',
            };

            expect(
                updateSubscriptionKeysIfCorrectID({
                    idToUpdate: 'subscription-123',
                    subscription,
                    keys,
                })
            ).toStrictEqual({
                ...subscription,
                ...keys,
            });
        });
    });

    describe('formatSubscriptionResponse', () => {
        it('should correctly format response with active subscriptions', () => {
            const activeSubscription1 = { ...subscription, UnsubscribedTime: 0 };
            const activeSubscription2 = { ...secondSubscription, UnsubscribedTime: 0 };
            const data = {
                NewsletterSubscriptions: [activeSubscription1, activeSubscription2],
                PageInfo: {
                    Total: 2,
                    NextPage: null,
                },
            };

            expect(formatSubscriptionResponse(data)).toStrictEqual({
                counts: {
                    active: 2,
                    unsubscribe: 0,
                },
                subscriptions: data.NewsletterSubscriptions,
                selectedSubscription: activeSubscription1,
                filteredSubscriptions: [activeSubscription1, activeSubscription2],
                loading: false,
                selectedTab: 'active',
            });
        });

        it('should correctly format response with mixed active and unsubscribed subscriptions', () => {
            const activeSubscription = { ...subscription, UnsubscribedTime: 0 };
            const unsubscribedSubscription = { ...secondSubscription, UnsubscribedTime: 123456789 };
            const data = {
                NewsletterSubscriptions: [activeSubscription, unsubscribedSubscription],
                PageInfo: {
                    Total: 2,
                    NextPage: null,
                },
            };

            expect(formatSubscriptionResponse(data)).toStrictEqual({
                counts: {
                    active: 1,
                    unsubscribe: 1,
                },
                subscriptions: data.NewsletterSubscriptions,
                selectedSubscription: activeSubscription,
                filteredSubscriptions: [activeSubscription],
                loading: false,
                selectedTab: 'active',
            });
        });

        it('should correctly format response with only unsubscribed subscriptions', () => {
            const unsubscribedSubscription1 = { ...subscription, UnsubscribedTime: 123456789 };
            const unsubscribedSubscription2 = { ...secondSubscription, UnsubscribedTime: 987654321 };
            const data = {
                NewsletterSubscriptions: [unsubscribedSubscription1, unsubscribedSubscription2],
                PageInfo: {
                    Total: 2,
                    NextPage: null,
                },
            };

            expect(formatSubscriptionResponse(data)).toStrictEqual({
                counts: {
                    active: 0,
                    unsubscribe: 2,
                },
                subscriptions: data.NewsletterSubscriptions,
                selectedSubscription: undefined,
                filteredSubscriptions: [],
                loading: false,
                selectedTab: 'active',
            });
        });

        it('should correctly format response with empty subscriptions array', () => {
            const data = {
                NewsletterSubscriptions: [],
                PageInfo: {
                    Total: 0,
                    NextPage: null,
                },
            };

            expect(formatSubscriptionResponse(data)).toStrictEqual({
                counts: {
                    active: 0,
                    unsubscribe: 0,
                },
                subscriptions: [],
                selectedSubscription: undefined,
                filteredSubscriptions: [],
                loading: false,
                selectedTab: 'active',
            });
        });
    });
});

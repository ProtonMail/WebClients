import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

export const activeSubscription: NewsletterSubscription = {
    ID: 'active-1',
    UserId: 'user-1',
    AddressId: 'address-1',
    ListId: 'list-1',
    SenderAddress: 'sender-1@proton.me',
    BimiSelector: 'bimi-1',
    Name: 'Active Subscription',
    UnsubscribedTime: 0,
    FirstReceivedTime: '2021-01-01',
    LastReceivedTime: '2021-01-01',
    LastReadTime: '2021-01-01',
    ReceivedMessageCount: 10,
    UnreadMessageCount: 5,
    MarkAsRead: false,
    MoveToFolder: null,
    ReceivedMessages: {
        Total: 10,
        Last30Days: 5,
        Last90Days: 3,
    },
    UnsubscribeMethods: {
        HttpClient: '',
        OneClick: 'OneClick',
    },
    Unsubscribed: false,
    Spam: false,
    Hidden: false,
    DiscussionsGroup: false,
};

export const unsubscribedSubscription: NewsletterSubscription = {
    ...activeSubscription,
    UnsubscribedTime: 1718745600,
};

export const generateSubscriptionList = (count: number, override: Partial<NewsletterSubscription> = {}) => {
    return Array.from({ length: count }, (_, index) => ({
        ...activeSubscription,
        ...override,
        ID: `active-${index + 1}`,
    }));
};

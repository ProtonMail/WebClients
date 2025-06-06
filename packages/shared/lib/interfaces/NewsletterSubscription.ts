import type { UnsubscribeMethods } from './mail/Message';

export interface NewsletterSubscription {
    ID: string;
    UserId: string;
    AddressId: string;
    ListId: string;
    FilterID?: string;
    SenderAddress: string;
    BimiSelector: string;
    Name: string;
    UnsubscribedTime: number;
    FirstReceivedTime: string;
    LastReceivedTime: string;
    LastReadTime: string;
    ReceivedMessageCount: number;
    UnreadMessageCount: number;
    TrackersCount?: number;
    MarkAsRead: boolean;
    MoveToFolder: string;
    ReceivedMessages: {
        Total: number;
        Last30Days: number;
        Last90Days: number;
    };
    UnsubscribeMethods: UnsubscribeMethods;
}

export interface POSTSubscriptionAPIResponse {
    NewsletterSubscription: NewsletterSubscription;
}

export interface GetNewsletterSubscriptionsNextPage {
    Pagination: {
        AddressIDs: string[];
        AnchorID: string | null;
        AnchorLastReceivedTime: string | null;
        PageSize: number;
    };
}

export interface GetNewsletterSubscriptionsApiResponse {
    NewsletterSubscriptions: NewsletterSubscription[];
    PageInfo: {
        Total: number;
        NextPage: GetNewsletterSubscriptionsNextPage | null;
    };
}

export interface ApplyNewsletterSubscriptionsFilter {
    ApplyTo: 'All' | 'Existing' | 'New';
    DestinationFolder?: string;
    MarkAsRead?: boolean;
}

export interface UpdateNewsletterSubscription {
    Unsubscribed?: boolean;
}

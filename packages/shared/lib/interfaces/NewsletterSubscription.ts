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
}

export interface FilterSubscriptionAPIResponse {
    NewsletterSubscription: NewsletterSubscription;
}

export interface GetNewsletterSubscriptionsApiResponse {
    NewsletterSubscriptions: NewsletterSubscription[];
    PageInfo: {
        Total: number;
        NextPage: string | null;
    };
}

export interface ApplyNewsletterSubscriptionsFilter {
    ApplyTo: 'All' | 'Existing' | 'New';
    DestinationFolder?: string;
    MarkAsRead?: boolean;
}

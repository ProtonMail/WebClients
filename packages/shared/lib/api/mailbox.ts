export interface MailboxItemsQueryParams {
    Location?: string;
    Page?: number;
    PageSize?: number;
    Limit?: number;
    LabelID?: string | string[];
    Sort?: string;
    Desc?: number;
    Begin?: number;
    End?: number;
    BeginID?: string;
    EndID?: string;
    Keyword?: string;
    To?: string;
    From?: string;
    Subject?: string;
    Attachments?: number;
    Starred?: number;
    Unread?: number;
    AddressID?: string;
    ID?: string;
    AutoWildcard?: number;
    Anchor?: string;
    AnchorID?: string;
    NewsletterSubscriptionID?: string | null;
}

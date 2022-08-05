import { SpamAction } from '../interfaces';

interface QueryConversationProps {
    Location: any;
    Sort: any;
    To: any;
    Starred: any;
    Page: number;
    PageSize: number;
    Limit: Number;
    LabelID: string;
    Desc: number;
    Begin: string;
    End: string;
    BeginID: string;
    EndID: string;
    Keyword: string;
    From: string;
    Subject: string;
    Attachments: number;
    Unread: number;
    AddressID: string;
    ID: string;
    AutoWildcard: number;
}

export const queryConversations = ({
    Location,
    Page = 0,
    PageSize = 50,
    Limit = 50,
    LabelID,
    Sort,
    Desc = 1,
    Begin,
    End,
    BeginID,
    EndID,
    Keyword,
    To,
    From,
    Subject,
    Attachments,
    Starred,
    Unread,
    AddressID,
    ID,
    AutoWildcard,
}: QueryConversationProps) => ({
    method: 'get',
    url: 'mail/v4/conversations',
    params: {
        Location,
        Page,
        PageSize,
        Limit,
        LabelID,
        Sort,
        Desc,
        Begin,
        End,
        BeginID,
        EndID,
        Keyword,
        Recipients: To,
        From,
        Subject,
        Attachments,
        Starred,
        Unread,
        AddressID,
        ID,
        AutoWildcard,
    },
});

export const getConversation = (conversationID: string, MessageID?: string) => ({
    method: 'get',
    url: `mail/v4/conversations/${conversationID}`,
    params: { MessageID },
});

export const queryConversationCount = (AddressID: string) => ({
    method: 'get',
    url: 'mail/v4/conversations/count',
    params: { AddressID },
});

export const markConversationsAsRead = (IDs: string[]) => ({
    method: 'put',
    url: 'mail/v4/conversations/read',
    data: { IDs },
});

export const markConversationsAsUnread = (IDs: string[], LabelID: string) => ({
    method: 'put',
    url: 'mail/v4/conversations/unread',
    data: { IDs, LabelID },
});

export const deleteConversations = (IDs: string[], LabelID: string) => ({
    method: 'put',
    url: 'mail/v4/conversations/delete',
    data: { IDs, LabelID },
});

interface LabelConversationsProps {
    LabelID: string;
    IDs: string[];
    SpamAction?: SpamAction;
}

export const labelConversations = ({ LabelID, IDs, SpamAction }: LabelConversationsProps) => ({
    method: 'put',
    url: 'mail/v4/conversations/label',
    data: { LabelID, IDs, SpamAction },
});

export const unlabelConversations = ({ LabelID, IDs }: LabelConversationsProps) => ({
    method: 'put',
    url: 'mail/v4/conversations/unlabel',
    data: { LabelID, IDs },
});

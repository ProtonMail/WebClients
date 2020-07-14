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
    AutoWildcard
} = {}) => ({
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
        To,
        From,
        Subject,
        Attachments,
        Starred,
        Unread,
        AddressID,
        ID,
        AutoWildcard
    }
});

export const getConversation = (conversationID, MessageID) => ({
    method: 'get',
    url: `mail/v4/conversations/${conversationID}`,
    params: { MessageID }
});

export const queryConversationCount = (AddressID) => ({
    method: 'get',
    url: 'mail/v4/conversations/count',
    params: { AddressID }
});

export const markConversationsAsRead = (IDs) => ({
    method: 'put',
    url: 'mail/v4/conversations/read',
    data: { IDs }
});

export const markConversationsAsUnread = (IDs) => ({
    method: 'put',
    url: 'mail/v4/conversations/unread',
    data: { IDs }
});

export const deleteConversations = (IDs) => ({
    method: 'put',
    url: 'mail/v4/conversations/delete',
    data: { IDs }
});

export const labelConversations = ({ LabelID, IDs } = {}) => ({
    method: 'put',
    url: 'mail/v4/conversations/label',
    data: { LabelID, IDs }
});

export const unlabelConversations = ({ LabelID, IDs } = {}) => ({
    method: 'put',
    url: 'mail/v4/conversations/unlabel',
    data: { LabelID, IDs }
});

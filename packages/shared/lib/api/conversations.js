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
}) => ({
    method: 'get',
    url: 'conversations',
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
    url: `conversations/${conversationID}`,
    params: { MessageID }
});

export const queryGroupedConversationCount = (AddressID) => ({
    method: 'get',
    url: 'conversations/count',
    params: { AddressID }
});

export const markConversationsAsRead = (IDs) => ({
    method: 'put',
    url: 'conversations/read',
    data: { IDs }
});

export const markConversationsAsUnread = (IDs) => ({
    method: 'put',
    url: 'conversations/unread',
    data: { IDs }
});

export const deleteConversations = (IDs) => ({
    method: 'put',
    url: 'conversations/delete',
    data: { IDs }
});

export const labelConversations = ({ LabelID, IDs }) => ({
    method: 'put',
    url: 'conversations/label',
    data: { LabelID, IDs }
});

export const unlabelConversations = ({ LabelID, IDs }) => ({
    method: 'put',
    url: 'conversations/unlabel',
    data: { LabelID, IDs }
});

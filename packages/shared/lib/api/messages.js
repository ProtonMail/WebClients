export const queryMessageMetadata = ({
    Location,
    Page = 0,
    PageSize = 50,
    Limit = 50,
    LabelID,
    Sort = 'Time',
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
    url: 'messages',
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

export const queryMessageCount = (AddressID) => ({
    method: 'get',
    url: 'messages/count',
    params: { AddressID }
});

export const getMessage = (messageID) => ({
    method: 'get',
    url: `messages/${messageID}`
});

export const sendMessage = (messageID, { ExpirationTime, ExpiresIn, AutoSaveContacts, Packages }) => ({
    method: 'post',
    url: `messages/${messageID}`,
    data: { ExpirationTime, ExpiresIn, AutoSaveContacts, Packages }
});

export const createDraft = ({ Message, ParentID, Action, AttachmentKeyPackets }) => ({
    method: 'post',
    url: 'messages',
    data: { Message, ParentID, Action, AttachmentKeyPackets }
});

export const updateDraft = (messageID, Message, AttachmentKeyPackets) => ({
    method: 'put',
    url: `messages/${messageID}`,
    data: { Message, AttachmentKeyPackets }
});

export const readReceipt = (messageID) => ({
    method: 'post',
    url: `messages/${messageID}/receipt`
});

export const markMessageAsRead = (IDs) => ({
    method: 'put',
    url: 'messages/read',
    data: { IDs }
});

export const markMessageAsUnread = (IDs) => ({
    method: 'put',
    url: 'messages/unread',
    data: { IDs }
});

export const deleteMessages = (IDs) => ({
    method: 'put',
    url: 'messages/delete',
    data: { IDs }
});

export const undeleteMessages = (IDs) => ({
    method: 'put',
    url: 'messages/undelete',
    data: { IDs }
});

export const labelMessages = ({ LabelID, IDs }) => ({
    method: 'put',
    url: 'messages/label',
    data: { LabelID, IDs }
});

export const unlabelMessages = ({ LabelID, IDs }) => ({
    method: 'put',
    url: 'messages/unlabel',
    data: { LabelID, IDs }
});

export const emptyLabel = ({ LabelID, AddressID }) => ({
    method: 'delete',
    url: 'messages/empty',
    params: { LabelID, AddressID }
});

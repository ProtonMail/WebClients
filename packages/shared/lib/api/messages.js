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
    AutoWildcard,
}) => ({
    method: 'get',
    url: 'mail/v4/messages',
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
        AutoWildcard,
    },
});

export const queryMessageCount = (AddressID) => ({
    method: 'get',
    url: 'mail/v4/messages/count',
    params: { AddressID },
});

export const getMessage = (messageID) => ({
    method: 'get',
    url: `mail/v4/messages/${messageID}`,
});

export const sendMessage = (
    messageID,
    { ExpirationTime, ExpiresIn, AutoSaveContacts, Packages, DelaySeconds = 0 }
) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}`,
    data: { ExpirationTime, ExpiresIn, AutoSaveContacts, Packages, DelaySeconds },
});

export const sendMessageDirect = ({
    Message,
    ParentID,
    Action,
    AttachmentKeys,
    ExpirationTime,
    ExpiresIn,
    AutoSaveContacts,
    Packages,
}) => ({
    method: 'post',
    url: `mail/v4/messages/send/direct`,
    data: { Message, ParentID, Action, AttachmentKeys, ExpirationTime, ExpiresIn, AutoSaveContacts, Packages },
});

export const createDraft = ({ Message, ParentID, Action, AttachmentKeyPackets }) => ({
    method: 'post',
    url: 'mail/v4/messages',
    data: { Message, ParentID, Action, AttachmentKeyPackets },
});

export const updateDraft = (messageID, Message, AttachmentKeyPackets) => ({
    method: 'put',
    url: `mail/v4/messages/${messageID}`,
    data: { Message, AttachmentKeyPackets },
});

export const readReceipt = (messageID) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}/receipt`,
});

export const markAsHam = (messageID) => ({
    method: 'put',
    url: `mail/v4/messages/${messageID}/mark/ham`,
});

export const markMessageAsRead = (IDs) => ({
    method: 'put',
    url: 'mail/v4/messages/read',
    data: { IDs },
});

export const markMessageAsUnread = (IDs) => ({
    method: 'put',
    url: 'mail/v4/messages/unread',
    data: { IDs },
});

export const deleteMessages = (IDs) => ({
    method: 'put',
    url: 'mail/v4/messages/delete',
    data: { IDs },
});

export const undeleteMessages = (IDs) => ({
    method: 'put',
    url: 'mail/v4/messages/undelete',
    data: { IDs },
});

export const labelMessages = ({ LabelID, IDs }) => ({
    method: 'put',
    url: 'mail/v4/messages/label',
    data: { LabelID, IDs },
});

export const unlabelMessages = ({ LabelID, IDs }) => ({
    method: 'put',
    url: 'mail/v4/messages/unlabel',
    data: { LabelID, IDs },
});

export const emptyLabel = ({ LabelID, AddressID }) => ({
    method: 'delete',
    url: 'mail/v4/messages/empty',
    params: { LabelID, AddressID },
});

export const cancelSend = (messageID) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}/cancel_send`,
});

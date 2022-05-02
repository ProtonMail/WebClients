import { SimpleMap } from '../interfaces';
import { PackageDirect } from '../interfaces/mail/crypto';
import { Message } from '../interfaces/mail/Message';
import { CREATE_DRAFT_MESSAGE_ACTION, SEND_MESSAGE_DIRECT_ACTION } from '../interfaces/message';

type BaseMessage = Pick<
    Message,
    'ToList' | 'CCList' | 'BCCList' | 'Subject' | 'Sender' | 'Body' | 'MIMEType' | 'Attachments' | 'Flags'
>;

interface QueryMessageMetadataParams {
    Location?: string;
    Page?: number;
    PageSize?: number;
    Limit?: number;
    LabelID?: string[];
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
}

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
}: QueryMessageMetadataParams) => ({
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

export const queryMessageCount = (AddressID: string) => ({
    method: 'get',
    url: 'mail/v4/messages/count',
    params: { AddressID },
});

export const getMessage = (messageID: string) => ({
    method: 'get',
    url: `mail/v4/messages/${messageID}`,
});

interface SendMessageData {
    AutoSaveContacts: number;
    DelaySeconds?: number;
    DeliveryTime?: number;
    ExpirationTime?: number;
    ExpiresIn?: number;
    Packages: PackageDirect[];
}

export const sendMessage = (
    messageID: string,
    { ExpirationTime, ExpiresIn, AutoSaveContacts, Packages, DelaySeconds = 0, DeliveryTime }: SendMessageData
) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}`,
    data: { ExpirationTime, ExpiresIn, AutoSaveContacts, Packages, DelaySeconds, DeliveryTime },
});

export const sendMessageForm = (messageID: string, data: any) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}`,
    input: 'form',
    data,
});

interface SendMessageDirectData {
    Message: BaseMessage;
    ParentID?: number;
    Action?: SEND_MESSAGE_DIRECT_ACTION;
    AttachmentKeys: SimpleMap<string>;
    ExpirationTime?: number;
    ExpiresIn?: number;
    AutoSaveContacts: number;
    Packages: PackageDirect[];
}

export const sendMessageDirect = ({
    Message,
    ParentID,
    Action,
    AttachmentKeys,
    ExpirationTime,
    ExpiresIn,
    AutoSaveContacts,
    Packages,
}: SendMessageDirectData) => ({
    method: 'post',
    url: `mail/v4/messages/send/direct`,
    data: { Message, ParentID, Action, AttachmentKeys, ExpirationTime, ExpiresIn, AutoSaveContacts, Packages },
});

interface CreateDraftData {
    Message: BaseMessage;
    ParentID?: string;
    Action?: CREATE_DRAFT_MESSAGE_ACTION;
    AttachmentKeyPackets: SimpleMap<string>;
}

export const createDraft = ({ Message, ParentID, Action, AttachmentKeyPackets }: CreateDraftData) => ({
    method: 'post',
    url: 'mail/v4/messages',
    data: { Message, ParentID, Action, AttachmentKeyPackets },
});

export const updateDraft = (messageID: string, Message: BaseMessage, AttachmentKeyPackets: SimpleMap<string>) => ({
    method: 'put',
    url: `mail/v4/messages/${messageID}`,
    data: { Message, AttachmentKeyPackets },
});

export const readReceipt = (messageID: string) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}/receipt`,
});

export const markAsHam = (messageID: string) => ({
    method: 'put',
    url: `mail/v4/messages/${messageID}/mark/ham`,
});

export const oneClickUnsubscribe = (ID: string) => ({
    method: 'post',
    url: `mail/v4/messages/${ID}/unsubscribe`,
});

export const markAsUnsubscribed = (IDs: string[]) => ({
    method: 'put',
    url: `mail/v4/messages/mark/unsubscribed`,
    data: { IDs },
});

export const markMessageAsRead = (IDs: string[]) => ({
    method: 'put',
    url: 'mail/v4/messages/read',
    data: { IDs },
});

export const markMessageAsUnread = (IDs: string[]) => ({
    method: 'put',
    url: 'mail/v4/messages/unread',
    data: { IDs },
});

export const deleteMessages = (IDs: string[], CurrentLabelID?: string) => ({
    method: 'put',
    url: 'mail/v4/messages/delete',
    data: { IDs, CurrentLabelID },
});

export const undeleteMessages = (IDs: string[]) => ({
    method: 'put',
    url: 'mail/v4/messages/undelete',
    data: { IDs },
});

export const labelMessages = ({ LabelID, IDs }: { LabelID: string; IDs: string[] }) => ({
    method: 'put',
    url: 'mail/v4/messages/label',
    data: { LabelID, IDs },
});

export const unlabelMessages = ({ LabelID, IDs }: { LabelID: string; IDs: string[] }) => ({
    method: 'put',
    url: 'mail/v4/messages/unlabel',
    data: { LabelID, IDs },
});

export const emptyLabel = ({ LabelID, AddressID }: { LabelID: string; AddressID: string | undefined }) => ({
    method: 'delete',
    url: 'mail/v4/messages/empty',
    params: { LabelID, AddressID },
});

export const moveAll = ({
    SourceLabelID,
    DestinationLabelID,
}: {
    SourceLabelID: string;
    DestinationLabelID: string;
}) => ({
    method: 'put',
    url: 'mail/v4/messages/move',
    data: { SourceLabelID, DestinationLabelID },
});

export const cancelSend = (messageID: string) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}/cancel_send`,
});

export const forceSend = (messageID: string) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}/force_send`,
});

export const unsubscribeMessages = (IDs: string[]) => ({
    method: 'post',
    url: 'mail/v4/messages/unsubscribe',
    data: { IDs },
});
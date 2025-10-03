import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import type { SimpleMap } from '../interfaces';
import type { Message } from '../interfaces/mail/Message';
import type { PackageDirect } from '../interfaces/mail/crypto';
import type { CREATE_DRAFT_MESSAGE_ACTION, SEND_MESSAGE_DIRECT_ACTION } from '../interfaces/message';
import { getAppropriateSort } from './helpers/snoozeSort';
import type { CountParams } from './interface';
import type { MailboxItemsQueryParams } from './mailbox';

type BaseMessage = Pick<
    Message,
    'ToList' | 'CCList' | 'BCCList' | 'Subject' | 'Sender' | 'Body' | 'MIMEType' | 'Attachments' | 'Flags'
>;

export interface MailSearchContext {
    LabelID: string;
}

export const queryMessageMetadata = ({
    Location,
    Page,
    PageSize,
    Limit,
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
    Anchor,
    AnchorID,
    NewsletterSubscriptionID,
}: MailboxItemsQueryParams) => ({
    method: 'get',
    url: 'mail/v4/messages',
    params: {
        Location,
        Page,
        PageSize,
        Limit,
        LabelID,
        Sort: getAppropriateSort(LabelID, Sort),
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
        Anchor,
        AnchorID,
        NewsletterSubscriptionID: !!NewsletterSubscriptionID ? [NewsletterSubscriptionID] : [],
    },
});

export const queryMessageCount = ({ AddressID, OnlyInInboxForCategories }: CountParams) => ({
    method: 'get',
    url: 'mail/v4/messages/count',
    params: { AddressID, OnlyInInboxForCategories },
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

export const sendMessageForm = (messageID: string, data: any, sendingFrom?: string) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}`,
    input: 'form',
    data,
    params: {
        Source: sendingFrom,
    },
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

interface UpdateDraftData {
    Message: BaseMessage;
    AttachmentKeyPackets: SimpleMap<string>;
}

interface CreateDraftData extends UpdateDraftData {
    ParentID?: string;
    Action?: CREATE_DRAFT_MESSAGE_ACTION;
}

export const createDraft = ({ Message, ParentID, Action, AttachmentKeyPackets }: CreateDraftData) => ({
    method: 'post',
    url: 'mail/v4/messages',
    data: { Message, ParentID, Action, AttachmentKeyPackets },
});

export const updateDraft = (messageID: string, { Message, AttachmentKeyPackets }: UpdateDraftData) => ({
    method: 'put',
    url: `mail/v4/messages/${messageID}`,
    data: { Message, AttachmentKeyPackets },
});

export const updateBody = (messageID: string, data: { Body: string }) => ({
    method: 'post',
    url: `mail/v4/messages/${messageID}/body`,
    data,
});

export const markAsBroken = (messageID: string) => ({
    method: 'put',
    url: `mail/v4/messages/${messageID}/mark/broken`,
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

export const markAllMessagesAsRead = ({ SearchContext }: { SearchContext: MailSearchContext }) => ({
    method: 'post',
    url: 'mail/v4/messages/batch/read',
    data: { SearchContext },
});

export const markAllMessagesAsUnread = ({ SearchContext }: { SearchContext: MailSearchContext }) => ({
    method: 'post',
    url: 'mail/v4/messages/batch/unread',
    data: { SearchContext },
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

export const labelMessages = ({
    LabelID,
    IDs,
    SpamAction,
}: {
    LabelID: string;
    IDs: string[];
    SpamAction?: SPAM_ACTION;
}) => ({
    method: 'put',
    url: 'mail/v4/messages/label',
    data: { LabelID, IDs, SpamAction },
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

export const labelAll = ({
    SearchContext,
    AddLabelIDs,
    RemoveLabelIDs,
}: {
    SearchContext: MailSearchContext;
    AddLabelIDs: string[];
    RemoveLabelIDs: string[];
}) => ({
    method: 'post',
    url: 'mail/v4/messages/batch/label',
    data: { SearchContext, AddLabelIDs, RemoveLabelIDs },
});

export const moveAllBatch = ({
    SearchContext,
    DestinationLabelID,
}: {
    SearchContext: MailSearchContext;
    DestinationLabelID: string;
}) => ({
    method: 'post',
    url: 'mail/v4/messages/batch/move',
    data: { SearchContext, DestinationLabelID },
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

export const setExpiration = (IDs: string[], ExpirationTime: number | null) => ({
    method: 'put',
    url: 'mail/v4/messages/expire',
    data: { IDs, ExpirationTime },
});

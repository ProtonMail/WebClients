import { Location } from 'history';
import { formatRelative, format } from 'date-fns';
import { toMap, omit } from 'proton-shared/lib/helpers/object';
import { Label, LabelCount } from 'proton-shared/lib/interfaces/Label';
import { diff, unique } from 'proton-shared/lib/helpers/array';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { ELEMENT_TYPES } from '../constants';
import { Element } from '../models/element';
import { Sort, SearchParameters, Filter } from '../models/tools';
import { Message } from '../models/message';
import { isConversationMode } from './mailSettings';
import { hasAttachments as messageHasAttachments } from './message/messages';
import { hasAttachments as conversationHasAttachments } from './conversation';

import { LabelIDsChanges } from '../models/event';
import { Conversation } from '../models/conversation';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

export interface TypeParams {
    labelID?: string;
    mailSettings?: any;
    location: Location;
}

export const getCurrentType = ({ labelID, mailSettings, location }: TypeParams) =>
    isConversationMode(labelID, mailSettings, location) ? ELEMENT_TYPES.CONVERSATION : ELEMENT_TYPES.MESSAGE;

export const isMessage = (element: Element = {}): boolean => typeof (element as Message).ConversationID === 'string';
export const isConversation = (element: Element = {}): boolean => !isMessage(element);

/**
 * Get the date of an element.
 * @param element
 * @param labelID is only used for a conversation. Yet mandatory not to forget to consider its use.
 */
export const getDate = (element: Element | undefined, labelID: string | undefined) => {
    if (!element) {
        return new Date();
    }

    let time;

    if (isMessage(element)) {
        time = element.Time;
    } else {
        const conversation = element as Conversation;
        const labelTime = conversation.Labels?.find((label) => label.ID === labelID)?.ContextTime;
        if (labelTime) {
            time = labelTime;
        }
        if (!time && conversation.ContextTime) {
            time = conversation.ContextTime;
        }
    }

    return new Date((time || 0) * 1000);
};

/**
 * Get readable time to display from message / conversation
 * @param element.Time
 * @return Jan 17, 2016
 */
export const getReadableTime = (element: Element | undefined, labelID: string | undefined) =>
    formatRelative(getDate(element, labelID), new Date());

export const getReadableFullTime = (element: Element | undefined, labelID: string | undefined) =>
    format(getDate(element, labelID), 'Ppp');

/**
 * Return if the element is to be considered in read or unread status
 * @param element
 * @param labelID is only used for a conversation. Yet mandatory not to forget to consider its use.
 */
export const isUnread = (element: Element | undefined, labelID: string | undefined) => {
    if (!element) {
        return false;
    }

    if (isMessage(element)) {
        return (element as Message).Unread !== 0;
    } else {
        const conversation = element as Conversation;

        if (conversation.NumUnread !== undefined) {
            return conversation.NumUnread !== 0;
        }
        const labelUnread = conversation.Labels?.find((label) => label.ID === labelID)?.ContextNumUnread;
        if (labelUnread !== undefined) {
            return labelUnread !== 0;
        }
        if (conversation.ContextNumUnread !== undefined && conversation.ContextNumUnread !== 0) {
            return conversation.ContextNumUnread !== 0;
        }
    }

    return false;
};

export const getLabelIDs = (element?: Element) =>
    isMessage(element) ? element?.LabelIDs || [] : (element as Conversation).Labels?.map(({ ID }) => ID || '') || [];

export const hasLabel = (element: Element, labelID?: string) => {
    return getLabelIDs(element).some((ID) => labelID === ID);
};

export const isStarred = (element: Element) => getLabelIDs(element).includes(MAILBOX_LABEL_IDS.STARRED);

export const getSize = ({ Size = 0 }: Element) => Size;

export const sort = (elements: Element[], sort: Sort, labelID: string) => {
    const getValue = {
        Time: (element: Element, labelID: string) => getDate(element, labelID).getTime(),
        Size: getSize
    }[sort.sort] as any;
    const compare = (a: Element, b: Element) => {
        const valueA = getValue(a, labelID);
        const valueB = getValue(b, labelID);
        if (valueA === valueB) {
            return (a.Order || 0) - (b.Order || 0);
        }
        return sort.desc ? valueB - valueA : valueA - valueB;
    };
    return [...elements].sort((e1, e2) => compare(e1, e2));
};

export const getCounterMap = (
    labels: Label[],
    conversationCounters: LabelCount[],
    messageCounters: LabelCount[],
    mailSettings: MailSettings,
    location: Location
) => {
    const labelIDs = [...Object.values(MAILBOX_LABEL_IDS), ...labels.map((label) => label.ID || '')];
    const conversationCountersMap = toMap(conversationCounters, 'LabelID') as { [labelID: string]: LabelCount };
    const messageCountersMap = toMap(messageCounters, 'LabelID') as { [labelID: string]: LabelCount };

    return labelIDs.reduce((acc, labelID) => {
        const conversationMode = isConversationMode(labelID, mailSettings, location);
        const countersMap = conversationMode ? conversationCountersMap : messageCountersMap;
        acc[labelID] = countersMap[labelID];
        return acc;
    }, {} as { [labelID: string]: LabelCount | undefined });
};

export const hasAttachments = (element: Element) =>
    isMessage(element) ? messageHasAttachments(element as Message) : conversationHasAttachments(element);

/**
 * Starting from the element LabelIDs list, add and remove labels from an event manager event
 */
export const parseLabelIDsInEvent = (element: Element, changes: Element & LabelIDsChanges): Element => {
    const LabelIDs = unique(
        diff(element.LabelIDs || [], changes.LabelIDsRemoved || []).concat(changes.LabelIDsAdded || [])
    );
    return { ...element, ...omit(changes, ['LabelIDsRemoved', 'LabelIDsAdded']), LabelIDs };
};

export const isSearch = (searchParams: SearchParameters) =>
    !!searchParams.address ||
    !!searchParams.attachments ||
    !!searchParams.begin ||
    !!searchParams.end ||
    !!searchParams.from ||
    !!searchParams.keyword ||
    !!searchParams.to ||
    !!searchParams.wildcard;

export const isFilter = (filter: Filter) => Object.keys(filter).length > 0;

/**
 * Get the ID of the folder where the element is currently located
 */
export const getCurrentFolderID = (element: Element | undefined, customFoldersList: Folder[]): string => {
    const labelIDs = getLabelIDs(element);
    const standardFolders: { [labelID: string]: boolean } = {
        [INBOX]: true,
        [TRASH]: true,
        [SPAM]: true,
        [ARCHIVE]: true
    };
    const customFolders = toMap(customFoldersList, 'ID');
    return labelIDs.find((labelID) => standardFolders[labelID] || customFolders[labelID]) || '';
};

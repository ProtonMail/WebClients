import { format, formatRelative } from 'date-fns';
import { Location } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { omit, toMap } from '@proton/shared/lib/helpers/object';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label, LabelCount } from '@proton/shared/lib/interfaces/Label';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { hasAttachments as messageHasAttachments } from '@proton/shared/lib/mail/messages';
import diff from '@proton/utils/diff';
import unique from '@proton/utils/unique';

import { ELEMENT_TYPES } from '../constants';
import { Conversation } from '../models/conversation';
import { Element } from '../models/element';
import { LabelIDsChanges } from '../models/event';
import { Filter, SearchParameters, Sort } from '../models/tools';
import {
    getLabelIDs as conversationGetLabelIDs,
    getTime as conversationGetTime,
    hasAttachments as conversationHasAttachments,
    isUnread as conversationIsUnread,
    getNumAttachments as conversationNumAttachments,
} from './conversation';
import { isConversationMode } from './mailSettings';

const { INBOX, TRASH, SPAM, ARCHIVE, SCHEDULED } = MAILBOX_LABEL_IDS;

export interface TypeParams {
    labelID?: string;
    mailSettings?: any;
    location: Location;
}

export const getCurrentType = ({ labelID, mailSettings, location }: TypeParams) =>
    isConversationMode(labelID, mailSettings, location) ? ELEMENT_TYPES.CONVERSATION : ELEMENT_TYPES.MESSAGE;

export const isMessage = (element: Element | undefined): boolean =>
    typeof (element as Message)?.ConversationID === 'string';
export const isConversation = (element: Element | undefined): boolean => !isMessage(element);

/**
 * Get the date of an element.
 * @param element
 * @param labelID is only used for a conversation. Yet mandatory not to forget to consider its use.
 */
export const getDate = (element: Element | undefined, labelID: string | undefined) => {
    if (!element) {
        return new Date();
    }

    const time = isMessage(element) ? element.Time : conversationGetTime(element, labelID);

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
    }

    return conversationIsUnread(element as Conversation, labelID);
};

export const isUnreadMessage = (message: Message) => isUnread(message, undefined);

export const getLabelIDs = (element: Element | undefined, contextLabelID: string | undefined) =>
    isMessage(element)
        ? (element as Message | undefined)?.LabelIDs?.reduce<{ [labelID: string]: boolean | undefined }>(
              (acc, labelID) => {
                  acc[labelID] = true;
                  return acc;
              },
              {}
          ) || {}
        : conversationGetLabelIDs(element, contextLabelID);

export const hasLabel = (element: Element | undefined, labelID: string) =>
    getLabelIDs(element, undefined)[labelID] !== undefined;

export const isStarred = (element: Element) => hasLabel(element, MAILBOX_LABEL_IDS.STARRED);

export const getSize = (element: Element) => element.Size || 0;

export const sort = (elements: Element[], sort: Sort, labelID: string) => {
    const getValue = {
        Time: (element: Element, labelID: string) => getDate(element, labelID).getTime(),
        Size: getSize,
    }[sort.sort] as any;
    const compare = (a: Element, b: Element) => {
        let valueA = getValue(a, labelID);
        let valueB = getValue(b, labelID);
        if (valueA === valueB && sort.sort === 'Time') {
            valueA = a.Order || 0;
            valueB = b.Order || 0;
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

    return labelIDs.reduce<{ [labelID: string]: LabelCount | undefined }>((acc, labelID) => {
        const conversationMode = isConversationMode(labelID, mailSettings, location);
        const countersMap = conversationMode ? conversationCountersMap : messageCountersMap;
        acc[labelID] = countersMap[labelID];
        return acc;
    }, {});
};

export const hasAttachments = (element: Element) =>
    isMessage(element) ? messageHasAttachments(element as Message) : conversationHasAttachments(element);

export const getNumAttachments = (element: Element) =>
    isMessage(element) ? (element as Message)?.NumAttachments || 0 : conversationNumAttachments(element);

/**
 * Starting from the element LabelIDs list, add and remove labels from an event manager event
 */
export const parseLabelIDsInEvent = <T extends Element>(element: T, changes: T & LabelIDsChanges): T => {
    const omitted = omit(changes, ['LabelIDsRemoved', 'LabelIDsAdded']);
    if (isMessage(element)) {
        if (omitted?.LabelIDs) {
            return { ...element, ...omitted };
        }
        const LabelIDs = unique(
            diff((element as Message).LabelIDs || [], changes.LabelIDsRemoved || []).concat(changes.LabelIDsAdded || [])
        );
        return { ...element, ...omitted, LabelIDs };
    }
    // Conversation don't use LabelIDs even if these properties are still present in update events
    // The conversation.Labels object is fully updated each time so we can safely ignore them
    return { ...element, ...omitted };
};

export const isSearch = (searchParams: SearchParameters) =>
    !!searchParams.address ||
    searchParams.attachments !== undefined ||
    !!searchParams.begin ||
    !!searchParams.end ||
    !!searchParams.from ||
    !!searchParams.keyword ||
    !!searchParams.to ||
    !!searchParams.wildcard;

export const isFilter = (filter: Filter) => Object.keys(filter).length > 0;

/**
 * Get the IDs of the folder where the element is currently located
 */
export const getCurrentFolderIDs = (element: Element | undefined, customFoldersList: Folder[]): string[] => {
    const labelIDs = getLabelIDs(element, undefined);
    const standardFolders: { [labelID: string]: boolean } = {
        [INBOX]: true,
        [TRASH]: true,
        [SPAM]: true,
        [ARCHIVE]: true,
        [SCHEDULED]: true,
    };
    const customFolders = toMap(customFoldersList, 'ID');
    return Object.keys(labelIDs).filter((labelID) => standardFolders[labelID] || customFolders[labelID]) || '';
};

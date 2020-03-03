import { Location } from 'history';
import { formatRelative, format } from 'date-fns';
import { toMap, omit } from 'proton-shared/lib/helpers/object';

import { ELEMENT_TYPES } from '../constants';
import { Element } from '../models/element';
import { Sort } from '../models/tools';
import { Message } from '../models/message';
import { isConversationMode } from './mailSettings';
import { LabelCount, Label } from '../models/label';
import { MailSettings } from '../models/utils';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { hasAttachments as messageHasAttachments } from './message/messages';
import { hasAttachments as conversationHasAttachments } from './conversation';
import { diff } from 'proton-shared/lib/helpers/array';
import { LabelIDsChanges } from '../models/event';

export interface TypeParams {
    labelID?: string;
    mailSettings?: any;
    location: Location;
}

export const getCurrentType = ({ labelID, mailSettings, location }: TypeParams) =>
    isConversationMode(labelID, mailSettings, location) ? ELEMENT_TYPES.CONVERSATION : ELEMENT_TYPES.MESSAGE;

export const isMessage = (element: Element = {}): boolean => typeof (element as Message).ConversationID === 'string';
export const isConversation = (element: Element = {}): boolean => !isMessage(element);

export const getDate = ({ Time = 0, ContextTime = 0 }: Element = {}) => new Date((ContextTime || Time) * 1000);

/**
 * Get readable time to display from message / conversation
 * @param {Integer} element.Time
 * @return {String} Jan 17, 2016
 */
export const getReadableTime = ({ Time = 0, ContextTime = 0 }: Element = {}) => {
    const date = new Date((ContextTime || Time) * 1000);
    const now = new Date();
    return formatRelative(date, now);
};

export const getReadableFullTime = ({ Time = 0, ContextTime = 0 }: Element = {}) => {
    const date = new Date((ContextTime || Time) * 1000);
    return format(date, 'Ppp');
};

export const isUnread = (element: Element) => {
    if ('NumUnread' in element) {
        return element.NumUnread !== 0;
    }
    if ('Unread' in element) {
        return element.Unread !== 0;
    }
    return false;
};

export const getLabel = ({ Labels = [] }: Element, labelID: string) => Labels.find(({ ID = '' }) => ID === labelID);

export const getLabelIDs = (element: Element) =>
    isMessage(element) ? element.LabelIDs || [] : element.Labels?.map(({ ID }) => ID || '') || [];

export const hasLabel = (element: Element, labelID?: string) => {
    return getLabelIDs(element).some((ID) => labelID === ID);
};

export const isStarred = (element: Element) => getLabelIDs(element).includes(MAILBOX_LABEL_IDS.STARRED);

export const getTime = (element: Element, labelID: string) =>
    element.ContextTime || element.Time || (getLabel(element, labelID) || {}).ContextTime || 0;

export const getSize = ({ Size = 0 }: Element) => Size;

export const sort = (elements: Element[], sort: Sort, labelID: string) => {
    const getValue = {
        Time: getTime,
        Size: getSize
    }[sort.sort];
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
    isMessage(element) ? messageHasAttachments(element) : conversationHasAttachments(element);

/**
 * Starting from the element LabelIDs list, add and remove labels from an event manager event
 */
export const parseLabelIDsInEvent = (element: Element = {}, changes: Element & LabelIDsChanges): Element => {
    const LabelIDs = diff(element.LabelIDs || [], changes.LabelIDsRemoved || []).concat(changes.LabelIDsAdded);
    return { ...omit(changes, ['LabelIDsRemoved', 'LabelIDsAdded']), LabelIDs };
};

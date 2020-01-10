import { formatRelative, format } from 'date-fns';

import { ELEMENT_TYPES } from '../constants';
import { Element } from '../models/element';
import { Sort } from '../models/tools';
import { Message } from '../models/message';
import { isConversationMode } from './mailSettings';

export interface TypeParams {
    labelID?: string;
    mailSettings?: any;
}

export const getCurrentType = ({ labelID, mailSettings }: TypeParams) =>
    isConversationMode(labelID, mailSettings) ? ELEMENT_TYPES.CONVERSATION : ELEMENT_TYPES.MESSAGE;

export const isMessage = (element: Element): boolean => typeof (element as Message).ConversationID === 'string';
export const isConversation = (element: Element): boolean => !isMessage(element);

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

export const hasLabel = (element: Element, labelID: string) => {
    const labelIDs = element.Labels ? element.Labels.map(({ ID }) => ID || '') : element.LabelIDs || [];
    return labelIDs.some((ID) => labelID === ID);
};

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

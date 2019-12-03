import { formatRelative, format } from 'date-fns';
import { MAILBOX_LABEL_IDS, VIEW_MODE } from 'proton-shared/lib/constants';

import { ELEMENT_TYPES } from '../constants';
import { Element } from '../models/element';
import { Sort } from '../models/tools';
// import { Conversation } from '../models/conversation';

const { SENT, ALL_SENT, DRAFTS, ALL_DRAFTS, ALL_MAIL } = MAILBOX_LABEL_IDS;

export interface TypeParams {
    labelID: string;
    mailSettings: any;
}

export const getCurrentType = ({ labelID = '', mailSettings = {} }: TypeParams) => {
    if ([SENT, ALL_SENT, DRAFTS, ALL_DRAFTS, ALL_MAIL].includes(labelID as MAILBOX_LABEL_IDS)) {
        return ELEMENT_TYPES.MESSAGE;
    }

    const { ViewMode = VIEW_MODE.GROUP } = mailSettings;
    return ViewMode === VIEW_MODE.GROUP ? ELEMENT_TYPES.CONVERSATION : ELEMENT_TYPES.MESSAGE;
};

export const isConversation = (data: TypeParams) => ELEMENT_TYPES.CONVERSATION === getCurrentType(data);
export const isMessage = (data: TypeParams) => ELEMENT_TYPES.MESSAGE === getCurrentType(data);

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
    element.ContextTime || (getLabel(element, labelID) || {}).ContextTime || 0;

export const getSize = ({ Size = 0 }: Element) => Size;

export const sort = (elements: Element[], sort: Sort, labelID: string) => {
    const getValue = {
        Time: getTime,
        Size: getSize
    }[sort.sort];
    const compare = (a: number, b: number) => (sort.desc ? b - a : a - b);
    return elements.sort((e1, e2) => compare(getValue(e1, labelID), getValue(e2, labelID)));
};

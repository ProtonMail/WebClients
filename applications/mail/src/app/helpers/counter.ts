import { toMap } from 'proton-shared/lib/helpers/object';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { hasLabel, isUnread as testIsUnread } from './elements';
import { Element } from '../models/element';
import { LabelChanges } from './labels';

export const replaceCounter = (counters: LabelCount[], counter: LabelCount) =>
    counters.map((existingCounter: any) => {
        if (existingCounter.LabelID === counter.LabelID) {
            return counter;
        }
        return existingCounter;
    });

const fromMapToArray = (countersMap: { [labelID: string]: LabelCount }) =>
    Object.entries(countersMap).map(([, counter]) => counter);

// List of location where messages are marked automatically as read after moving by the API
const AUTO_READ = [MAILBOX_LABEL_IDS.TRASH];

// List of location that cannot be change by user interaction
const UNMODIFIABLE_BY_USER = [
    MAILBOX_LABEL_IDS.ALL_MAIL,
    MAILBOX_LABEL_IDS.ALL_SENT,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.OUTBOX,
];

export const updateCounters = (element: Element, counters: LabelCount[], changes: LabelChanges) => {
    const countersMap = Object.entries(changes).reduce((acc, [labelID, action]) => {
        if (UNMODIFIABLE_BY_USER.includes(labelID as MAILBOX_LABEL_IDS)) {
            return acc;
        }
        acc[labelID] = acc[labelID] || { Total: 0, Unread: 0, LabelID: labelID };

        const isUnread = testIsUnread(element, labelID);

        if (action) {
            acc[labelID].Total = (acc[labelID].Total || 0) + 1;
            if (isUnread && !AUTO_READ.includes(labelID as MAILBOX_LABEL_IDS)) {
                acc[labelID].Unread = (acc[labelID].Unread || 0) + 1;
            }
        } else {
            acc[labelID].Total = (acc[labelID].Total || 0) - 1;
            if (isUnread) {
                acc[labelID].Unread = (acc[labelID].Unread || 0) - 1;
            }
        }

        return acc;
    }, toMap(counters, 'LabelID'));
    return fromMapToArray(countersMap);
};

export const updateCountersForMarkAs = (elementBefore: Element, elementAfter: Element, counters: LabelCount[]) => {
    return counters.map((counter) => {
        if (!hasLabel(elementBefore, counter.LabelID || '')) {
            return counter;
        }

        const unreadBefore = testIsUnread(elementBefore, counter.LabelID);
        const unreadAfter = testIsUnread(elementAfter, counter.LabelID);

        let Unread = counter.Unread || 0;

        if (unreadBefore && !unreadAfter) {
            Unread -= 1;
        }

        if (!unreadBefore && unreadAfter) {
            Unread += 1;
        }

        return { ...counter, Unread };
    });
};

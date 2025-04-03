import { isAutoRead } from '@proton/mail/labels/helpers';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import type { Element } from '../models/element';
import { hasLabel, isUnread as testIsUnread } from './elements';
import type { LabelChanges } from './labels';

export const replaceCounter = (counters: LabelCount[], counter: LabelCount) =>
    counters.map((existingCounter: LabelCount) => {
        if (existingCounter.LabelID === counter.LabelID) {
            return { ...existingCounter, counter };
        }
        return existingCounter;
    });

const fromMapToArray = (countersMap: { [labelID: string]: LabelCount }) =>
    Object.entries(countersMap).map(([, counter]) => counter);

export const updateCounters = (element: Element, counters: LabelCount[], changes: LabelChanges) => {
    const countersMap = Object.entries(changes).reduce(
        (acc, [labelID, action]) => {
            acc[labelID] = { Total: 0, Unread: 0, LabelID: labelID, ...acc[labelID] };

            const isUnread = testIsUnread(element, labelID);

            if (action) {
                acc[labelID].Total = (acc[labelID].Total || 0) + 1;
                if (isUnread && !isAutoRead(labelID)) {
                    acc[labelID].Unread = (acc[labelID].Unread || 0) + 1;
                }
            } else {
                acc[labelID].Total = (acc[labelID].Total || 0) - 1;
                if (isUnread) {
                    acc[labelID].Unread = (acc[labelID].Unread || 0) - 1;
                }
            }

            return acc;
        },
        toMap(counters, 'LabelID')
    );
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

export const getCountersByLabelId = (counters: LabelCount[] = []) => {
    const result: { [labelID: string]: LabelCount } = {};
    for (let i = 0; i < counters.length; i++) {
        const current = counters[i];
        if (current.LabelID) {
            result[current.LabelID] = current;
        }
    }
    return result;
};

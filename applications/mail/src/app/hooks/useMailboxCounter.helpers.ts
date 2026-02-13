import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Label, LabelCount, MailSettings, SafeLabelCount } from '@proton/shared/lib/interfaces';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';

export type LocationCountMap = Record<string, SafeLabelCount>;

const getDisabledCategoriesCounts = (
    disabledCategoriesIDs: string[],
    resultCounterMap: Record<string, SafeLabelCount>
) => {
    return disabledCategoriesIDs.reduce(
        (acc, id) => {
            return {
                Total: acc.Total + (resultCounterMap[id]?.Total || 0),
                Unread: acc.Unread + (resultCounterMap[id]?.Unread || 0),
            };
        },
        { Total: 0, Unread: 0 }
    );
};

export const getCounterMap = (
    labels: Label[],
    conversationCounters: LabelCount[],
    messageCounters: LabelCount[],
    mailSettings: MailSettings,
    disabledCategoriesIDs: string[]
) => {
    const labelIDs = [...Object.values(MAILBOX_LABEL_IDS), ...labels.map((label) => label.ID || '')];

    const conversationCountersMap = toMap(conversationCounters, 'LabelID');
    const messageCountersMap = toMap(messageCounters, 'LabelID');

    const resultCounterMap: Record<string, SafeLabelCount> = {};
    for (const labelID of labelIDs) {
        const shouldUseConversationMode = isConversationMode(labelID, mailSettings);
        const selectedCountersLookup = shouldUseConversationMode ? conversationCountersMap : messageCountersMap;

        const count = selectedCountersLookup[labelID];
        resultCounterMap[labelID] = {
            LabelID: labelID,
            Total: count?.Total || 0,
            Unread: count?.Unread || 0,
        };
    }

    // We need to add the disabled categories totals to the default category
    if (disabledCategoriesIDs && resultCounterMap[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]) {
        const initialCount = resultCounterMap[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT];
        const disabledCounts = getDisabledCategoriesCounts(disabledCategoriesIDs, resultCounterMap);

        resultCounterMap[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT] = {
            LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
            Total: initialCount.Total + disabledCounts.Total,
            Unread: initialCount.Unread + disabledCounts.Unread,
        };
    }

    return resultCounterMap;
};

export const getLocationCount = (counterMap: LocationCountMap, labelId: string): SafeLabelCount => {
    const labelCount = counterMap[labelId];

    return {
        LabelID: labelId,
        Total: labelCount?.Total || 0,
        Unread: labelCount?.Unread || 0,
    };
};

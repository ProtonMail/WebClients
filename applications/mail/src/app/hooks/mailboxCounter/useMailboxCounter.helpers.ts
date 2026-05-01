import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Label, LabelCount, MailSettings, SafeLabelCount } from '@proton/shared/lib/interfaces';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';

import type { LocationCountMap } from './interface';

const getPrimaryCategoryCounts = (categoryIDs: string[], resultCounterMap: Record<string, SafeLabelCount>) => {
    return categoryIDs.reduce(
        (acc, id) => {
            return {
                Total: acc.Total + (resultCounterMap[id]?.Total || 0),
                Unread: acc.Unread + (resultCounterMap[id]?.Unread || 0),
            };
        },
        { Total: 0, Unread: 0 }
    );
};

export const getCounterMap = ({
    labels,
    conversationCounts,
    messageCounts,
    mailSettings,
    disabledCategoryIDs,
}: {
    labels: Label[];
    conversationCounts: LabelCount[];
    messageCounts: LabelCount[];
    mailSettings: MailSettings;
    disabledCategoryIDs: CategoryLabelID[];
}) => {
    const labelIDs = [...Object.values(MAILBOX_LABEL_IDS), ...labels.map((label) => label.ID || '')];

    const conversationCountersMap = toMap(conversationCounts, 'LabelID');
    const messageCountersMap = toMap(messageCounts, 'LabelID');

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

    // We compute the primary count all the time, to ensure it's always correct regardless of categories setting
    const primaryCategories = [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, ...disabledCategoryIDs];
    const disabledCounts = getPrimaryCategoryCounts(primaryCategories, resultCounterMap);

    resultCounterMap[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT] = {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        Total: disabledCounts.Total,
        Unread: disabledCounts.Unread,
    };

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

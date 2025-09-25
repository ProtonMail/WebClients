import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Label, LabelCount, MailSettings, SafeLabelCount } from '@proton/shared/lib/interfaces';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';

export type LocationCountMap = Record<string, SafeLabelCount>;

export const getCounterMap = (
    labels: Label[],
    conversationCounters: LabelCount[],
    messageCounters: LabelCount[],
    mailSettings: MailSettings
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

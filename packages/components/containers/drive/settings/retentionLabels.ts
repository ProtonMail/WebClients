import { c, msgid } from 'ttag';

import type { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

const retentionLabelForDays = (nbDay: number) => c('Label').ngettext(msgid`${nbDay} day`, `${nbDay} days`, nbDay);
const retentionLabelForYears = (nbYear: number) =>
    c('Label').ngettext(msgid`${nbYear} year`, `${nbYear} years`, nbYear);

export const getRetentionLabel = (nbDay: RevisionRetentionDaysSetting) => {
    // 10 years
    if (nbDay === 3650) {
        return retentionLabelForYears(10);
    }

    return retentionLabelForDays(nbDay);
};

import { c } from 'ttag';

import { getMailMappingErrors } from '@proton/activation/src/helpers/getMailMappingErrors';
import { ImportType, TIME_PERIOD } from '@proton/activation/src/interface';
import { ImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { willUserReachCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

export const getMailCustomLabel = (period?: TIME_PERIOD) => {
    if (!period) {
        return c('Label').t`Email`;
    }

    switch (period) {
        case TIME_PERIOD.BIG_BANG:
            return c('Label').t`Emails (all messages)`;
        case TIME_PERIOD.LAST_YEAR:
            return c('Label').t`Emails (last 12 months)`;
        case TIME_PERIOD.LAST_3_MONTHS:
            return c('Label').t`Emails (last 3 months)`;
        case TIME_PERIOD.LAST_MONTH:
            return c('Label').t`Emails (last month)`;
    }
};

export const importerHasErrors = (
    products: ImportType[],
    importerData: ImporterData,
    labels: Label[],
    folders: Folder[],
    calendars: VisualCalendar[],
    mailChecked: boolean,
    calendarChecked: boolean,
    isLabelMapping: boolean,
    isFreeUser: boolean
) => {
    const hasErrors = [];

    if (products?.includes(ImportType.MAIL) && mailChecked) {
        const mailMapping = importerData?.emails?.fields?.mapping;
        if (mailMapping) {
            const hasMailErrors = getMailMappingErrors(mailMapping, isLabelMapping, labels, folders);
            hasErrors.push(...hasMailErrors.errors);
        }
    }

    if (products?.includes(ImportType.CALENDAR) && calendarChecked) {
        const calendarsToBeCreatedCount =
            importerData?.calendars?.calendars?.filter((item) => item.checked && !item.mergedTo).length ?? 0;
        const limitReached = willUserReachCalendarsLimit(calendars, calendarsToBeCreatedCount, isFreeUser);

        hasErrors.push(limitReached);
    }

    return hasErrors.some(isTruthy);
};

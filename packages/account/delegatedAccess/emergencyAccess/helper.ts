import { c, msgid } from 'ttag';

import { DAY } from '@proton/shared/lib/constants';
import { isValidDate } from '@proton/shared/lib/date/date';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type { IncomingDelegatedAccessOutput } from '../interface';

export const getContact = (email: string, contactEmail: ContactEmail | undefined) => {
    if (!contactEmail || contactEmail.Name === email) {
        return {
            name: '',
            email,
            formatted: email,
        };
    }

    return {
        name: contactEmail.Name,
        email,
        formatted: `${contactEmail.Name} <${email}>`,
    };
};

export const getDaysLabel = (n: number) => {
    return c('emergency_access').ngettext(msgid`${n} day`, `${n} days`, n);
};

export const getDaysLeftLabel = (n: number) => {
    return c('emergency_access').ngettext(msgid`${n} day left`, `${n} days left`, n);
};

export const getDaysFromMilliseconds = (value: number) => {
    return Math.round(value / DAY);
};

export const getTriggerDelayLabel = (value: number) => {
    if (value === 0) {
        return c('emergency_access').t`Immediate`;
    }
    if (value < DAY) {
        return c('emergency_access').t`Less than a day`;
    }
    return getDaysLabel(getDaysFromMilliseconds(value));
};

export const getParsedAccessibleTime = (value: IncomingDelegatedAccessOutput['AccessibleTime']) => {
    if (!value) {
        return null;
    }
    const accessibleDate = new Date(value * 1000);
    if (!isValidDate(accessibleDate)) {
        return null;
    }
    return accessibleDate;
};

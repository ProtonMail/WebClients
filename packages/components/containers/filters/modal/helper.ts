import { ReactNode } from 'react';

import { c } from 'ttag';

import { Condition, ConditionComparator } from '@proton/components/containers/filters/interfaces';

export const getEmailSentLabel = (label: string) => {
    // Translator: the email was sent with attachments, or the email was sent without attachments
    return c('filter: Label').t`the email was sent ${label}`;
};

export const getEmailSentLabelJt = (label: ReactNode) => {
    // Translator: the email was sent with attachments, or the email was sent without attachments
    return c('filter: Label, jt').jt`the email was sent ${label}`;
};

export const getConditionLabel = (cond: Condition | undefined) => {
    return cond?.comparator === ConditionComparator.CONTAINS
        ? c('filter: Label').t`with attachments`
        : c('filter: Label').t`without attachments`;
};

import { c } from 'ttag';

export enum TIME_UNIT {
    BIG_BANG = 'big_bang',
    LAST_YEAR = 'last_year',
    LAST_3_MONTHS = 'last_3_months',
    LAST_MONTH = 'last_month',
}

export const timeUnitLabels = {
    [TIME_UNIT.BIG_BANG]: c('Label').t`Email account creation`,
    [TIME_UNIT.LAST_YEAR]: c('Label').t`12 months ago`,
    [TIME_UNIT.LAST_3_MONTHS]: c('Label').t`3 months ago`,
    [TIME_UNIT.LAST_MONTH]: c('Label').t`1 month ago`,
};

export const INVALID_CREDENTIALS_ERROR_LABEL = 'Invalid credentials';
export const IMAP_CONNECTION_ERROR_LABEL = 'Cannot establish connection with IMAP server';

export const PATH_SPLIT_REGEX = new RegExp(/(?<!\\)\//);

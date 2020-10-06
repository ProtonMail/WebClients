import { c } from 'ttag';
import { TIME_UNIT } from './interfaces';

export const timeUnitLabels = {
    [TIME_UNIT.BIG_BANG]: c('Label').t`Account creation date`,
    [TIME_UNIT.LAST_YEAR]: c('Label').t`12 months ago`,
    [TIME_UNIT.LAST_3_MONTHS]: c('Label').t`3 months ago`,
    [TIME_UNIT.LAST_MONTH]: c('Label').t`1 month ago`,
};

export const IMAPS = {
    GMAIL: 'imap.gmail.com',
    YAHOO: 'imap.mail.yahoo.com',
};

export const INVALID_CREDENTIALS_ERROR_LABEL = 'Invalid credentials';
export const IMAP_CONNECTION_ERROR_LABEL = 'Cannot establish connection with IMAP server';
export const IMAP_AUTHENTICATION_ERROR_LABEL = 'Authentication failed with IMAP server';

import { c } from 'ttag';
import { OAUTH_PROVIDER } from '../interfaces';
import { TIME_UNIT } from './interfaces';

export const timeUnitLabels = {
    [TIME_UNIT.BIG_BANG]: c('Label').t`Import all messages`,
    [TIME_UNIT.LAST_YEAR]: c('Label').t`Last 12 months only`,
    [TIME_UNIT.LAST_3_MONTHS]: c('Label').t`Last 3 months only`,
    [TIME_UNIT.LAST_MONTH]: c('Label').t`Last month only`,
};

export const MAX_FOLDER_LIMIT = 2000;

export const IMAPS = {
    [OAUTH_PROVIDER.GOOGLE]: 'imap.gmail.com',
    YAHOO: 'imap.mail.yahoo.com',
};

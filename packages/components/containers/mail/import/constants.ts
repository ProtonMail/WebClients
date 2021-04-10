import { c } from 'ttag';
import { TIME_UNIT } from './interfaces';

export const timeUnitLabels = {
    [TIME_UNIT.BIG_BANG]: c('Label').t`Import all messages`,
    [TIME_UNIT.LAST_YEAR]: c('Label').t`Last 12 months only`,
    [TIME_UNIT.LAST_3_MONTHS]: c('Label').t`Last 3 months only`,
    [TIME_UNIT.LAST_MONTH]: c('Label').t`Last month only`,
};

export const IMAPS = {
    GMAIL: 'imap.gmail.com',
    YAHOO: 'imap.mail.yahoo.com',
};

/* The following constants are use to forge OAuth URL in the import assistant */
export const G_OAUTH_CLIENT_ID = '923746734024-4rggv7tvusv9c0fi9tvh5elnuj5o067b.apps.googleusercontent.com';
export const G_OAUTH_SCOPE = ['email', 'openid', 'https://mail.google.com/'].join(' ');
export const G_OAUTH_REDIRECT_PATH = '/oauth/callback';

import { c } from 'ttag';

import { EMAIL_PLACEHOLDER, USERNAME_PLACEHOLDER } from '@proton/shared/lib/constants';
import {
    MailImportGmailCategories,
    NON_OAUTH_PROVIDER,
    OAUTH_PROVIDER,
    TIME_PERIOD,
} from '@proton/shared/lib/interfaces/EasySwitch';

export const G_OAUTH_REDIRECT_PATH = '/oauth/callback';

export const G_OAUTH_SCOPE_DEFAULT = ['email', 'openid'];
export const G_OAUTH_SCOPE_MAIL = ['https://mail.google.com/'];
export const G_OAUTH_SCOPE_CONTACTS = ['https://www.googleapis.com/auth/contacts.readonly'];

export const G_OAUTH_SCOPE_CALENDAR = ['https://www.googleapis.com/auth/calendar.readonly'];
// export const G_OAUTH_SCOPE_DRIVE = [];

export const IA_PATHNAME_REGEX = /\/easy-switch/;

/* Mail specific */

export const GMAIL_CATEGORIES = Object.values(MailImportGmailCategories);

export const getTimeUnitLabels = () => ({
    [TIME_PERIOD.BIG_BANG]: c('Label').t`Import all messages`,
    [TIME_PERIOD.LAST_YEAR]: c('Label').t`Last 12 months only`,
    [TIME_PERIOD.LAST_3_MONTHS]: c('Label').t`Last 3 months only`,
    [TIME_PERIOD.LAST_MONTH]: c('Label').t`Last month only`,
});

export const MAX_FOLDER_LIMIT = 20000;

export const IMAPS = {
    [OAUTH_PROVIDER.GOOGLE]: 'imap.gmail.com',
    [NON_OAUTH_PROVIDER.YAHOO]: 'imap.mail.yahoo.com',
    [NON_OAUTH_PROVIDER.OUTLOOK]: 'outlook.office365.com',
};

export const PORTS = {
    [OAUTH_PROVIDER.GOOGLE]: '993',
    [NON_OAUTH_PROVIDER.YAHOO]: '993',
    [NON_OAUTH_PROVIDER.OUTLOOK]: '993',
};

export const EASY_SWITCH_EMAIL_PLACEHOLDER = {
    [NON_OAUTH_PROVIDER.YAHOO]: `${USERNAME_PLACEHOLDER}@yahoo.com`,
    [NON_OAUTH_PROVIDER.OUTLOOK]: `${USERNAME_PLACEHOLDER}@outlook.com`,
    [NON_OAUTH_PROVIDER.DEFAULT]: EMAIL_PLACEHOLDER,
};

/* Calendar specific */

export const CALENDAR_TO_BE_CREATED_PREFIX = '###TO_BE_CREATED###';

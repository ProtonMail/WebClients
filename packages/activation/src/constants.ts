import { c } from 'ttag';

import type { CreateNotificationOptions } from '@proton/components';
import { EMAIL_PLACEHOLDER, USERNAME_PLACEHOLDER } from '@proton/shared/lib/constants';

import { ImportProvider, MailImportGmailCategories, OAUTH_PROVIDER, TIME_PERIOD } from './interface';

export const G_OAUTH_SCOPE_DEFAULT = ['email', 'openid'];

export const G_OAUTH_SCOPE_MAIL_READONLY = ['https://www.googleapis.com/auth/gmail.readonly'];

export const G_OAUTH_SCOPE_CONTACTS = ['https://www.googleapis.com/auth/contacts.readonly'];
export const G_OAUTH_SCOPE_CALENDAR = ['https://www.googleapis.com/auth/calendar.readonly'];
// export const G_OAUTH_SCOPE_DRIVE = [];

export const O_OAUTH_SCOPE_DEFAULT = ['email', 'openid', 'User.Read', 'offline_access'];
export const O_OAUTH_SCOPE_MAIL = ['Mail.read'];
export const O_OAUTH_SCOPE_CONTACTS = ['Contacts.read'];
export const O_OAUTH_SCOPE_CALENDAR = ['Calendars.read'];

export const IA_PATHNAME_REGEX = /\/easy-switch/;

/* Mail specific */

export const GMAIL_CATEGORIES = Object.values(MailImportGmailCategories);

export const getTimeUnitLabels = () => ({
    [TIME_PERIOD.BIG_BANG]: c('Label').t`Import all messages`,
    [TIME_PERIOD.LAST_YEAR]: c('Label').t`Last 12 months only`,
    [TIME_PERIOD.LAST_3_MONTHS]: c('Label').t`Last 3 months only`,
    [TIME_PERIOD.LAST_MONTH]: c('Label').t`Last month only`,
});

export const MAX_FOLDERS_DEPTH = 3;
export const MAX_FOLDER_LIMIT = 20000;

export const IMAPS = {
    [OAUTH_PROVIDER.GOOGLE]: 'imap.gmail.com',
    [ImportProvider.YAHOO]: 'export.imap.mail.yahoo.com',
    [ImportProvider.OUTLOOK]: 'outlook.office365.com',
    [OAUTH_PROVIDER.OUTLOOK]: 'outlook.office365.com',
};

export const EASY_SWITCH_EMAIL_PLACEHOLDER = {
    [ImportProvider.YAHOO]: `${USERNAME_PLACEHOLDER}@yahoo.com`,
    [ImportProvider.OUTLOOK]: `${USERNAME_PLACEHOLDER}@outlook.com`,
    [ImportProvider.GOOGLE]: `${USERNAME_PLACEHOLDER}@google.com`,
    [ImportProvider.DEFAULT]: EMAIL_PLACEHOLDER,
};

/* Calendar specific */

export const CALENDAR_TO_BE_CREATED_PREFIX = '###TO_BE_CREATED###';

/* Sync specific */

export const SYNC_G_OAUTH_SCOPES = [...G_OAUTH_SCOPE_DEFAULT, G_OAUTH_SCOPE_MAIL_READONLY];
export const SYNC_SUCCESS_NOTIFICATION: CreateNotificationOptions = {
    type: 'success',
    text: c('account').t`Forwarding will start soon. New emails will appear in your inbox.`,
};

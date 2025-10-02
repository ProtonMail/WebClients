import { DEFAULT_LOCALE } from '../../constants';
import type { Address, MailSettings, UserSettings } from '../../interfaces';
import { AUTO_SAVE_CONTACTS, DEFAULT_MAIL_SETTINGS, IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '../mailSettings';

export const EO_DEFAULT_USER_SETTINGS = {
    Referral: undefined,
    Locale: DEFAULT_LOCALE,
} as UserSettings;

export const EO_REPLY_NUM_ATTACHMENTS_LIMIT = 10;

export const EO_DEFAULT_MAILSETTINGS: MailSettings = {
    ...DEFAULT_MAIL_SETTINGS,
    AutoSaveContacts: AUTO_SAVE_CONTACTS.DISABLED,
    HideRemoteImages: SHOW_IMAGES.HIDE,
    HideEmbeddedImages: SHOW_IMAGES.HIDE,
    ImageProxy: IMAGE_PROXY_FLAGS.NONE,
};

export const eoDefaultAddress = {} as Address[];

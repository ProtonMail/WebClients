import { DEFAULT_LOCALE } from '../../constants';
import { Address, MailSettings, UserSettings } from '../../interfaces';
import { AUTO_SAVE_CONTACTS, DEFAULT_MAILSETTINGS, IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '../mailSettings';

export const EO_DEFAULT_USER_SETTINGS = {
    Referral: undefined,
    Locale: DEFAULT_LOCALE,
} as UserSettings;

export const EO_REPLY_NUM_ATTACHMENTS_LIMIT = 10;

export const EO_DEFAULT_MAILSETTINGS: MailSettings = {
    ...DEFAULT_MAILSETTINGS,
    AutoSaveContacts: AUTO_SAVE_CONTACTS.DISABLED,
    HideRemoteImages: SHOW_IMAGES.HIDE,
    HideEmbeddedImages: SHOW_IMAGES.HIDE,
    ImageProxy: IMAGE_PROXY_FLAGS.NONE,
};

export const eoDefaultAddress = {} as Address[];

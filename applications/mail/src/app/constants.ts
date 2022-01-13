import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { ESCache, ESIndexingState, ESStatus } from './models/encryptedSearch';

export const MAIN_ROUTE_PATH = '/:labelID?/:elementID?/:messageID?';

export const EXPIRATION_CHECK_FREQUENCY = 10000; // each 10 seconds
export const MAX_EXPIRATION_TIME = 672; // hours
export const PAGE_SIZE = 50;
export const ELEMENTS_CACHE_REQUEST_SIZE = 100;
export const DEFAULT_PLACEHOLDERS_COUNT = PAGE_SIZE;
export const ATTACHMENT_MAX_SIZE = 25000000; // bytes -> 25MB
export const LARGE_KEY_SIZE = 50 * 1024;
export const LOAD_RETRY_COUNT = 3;
export const LOAD_RETRY_DELAY = 3000; // in ms => 3s
export const PREVENT_CANCEL_SEND_INTERVAL = 30000; // Prevent form cancelling a message about to be sent 30s before

export const UNDO_SEND_DELAY = 5000;

export const SCHEDULED_MESSAGES_LIMIT = 100;
export const SCHEDULED_MAX_DATE_DAYS = 30;

export const MIN_DELAY_SENT_NOTIFICATION = 2500;

export const ELEMENT_TYPES = {
    MESSAGE: 'message',
    CONVERSATION: 'conversation',
};

export const LABEL_IDS_TO_HUMAN = {
    [MAILBOX_LABEL_IDS.INBOX]: 'inbox',
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: 'all-drafts',
    [MAILBOX_LABEL_IDS.ALL_SENT]: 'all-sent',
    [MAILBOX_LABEL_IDS.TRASH]: 'trash',
    [MAILBOX_LABEL_IDS.SPAM]: 'spam',
    [MAILBOX_LABEL_IDS.ALL_MAIL]: 'all-mail',
    [MAILBOX_LABEL_IDS.ARCHIVE]: 'archive',
    [MAILBOX_LABEL_IDS.SENT]: 'sent',
    [MAILBOX_LABEL_IDS.DRAFTS]: 'drafts',
    [MAILBOX_LABEL_IDS.STARRED]: 'starred',
    [MAILBOX_LABEL_IDS.OUTBOX]: 'outbox',
    [MAILBOX_LABEL_IDS.SCHEDULED]: 'scheduled',
};

export const HUMAN_TO_LABEL_IDS = Object.entries(LABEL_IDS_TO_HUMAN).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, Object.create(null));

export const getLabelIDsToI18N = () => ({
    [MAILBOX_LABEL_IDS.INBOX]: c('Link').t`Inbox`,
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: c('Link').t`Drafts`,
    [MAILBOX_LABEL_IDS.ALL_SENT]: c('Link').t`Sent`,
    [MAILBOX_LABEL_IDS.TRASH]: c('Link').t`Trash`,
    [MAILBOX_LABEL_IDS.SPAM]: c('Link').t`Spam`,
    [MAILBOX_LABEL_IDS.ALL_MAIL]: c('Link').t`All mail`,
    [MAILBOX_LABEL_IDS.ARCHIVE]: c('Link').t`Archive`,
    [MAILBOX_LABEL_IDS.SENT]: c('Link').t`Sent`,
    [MAILBOX_LABEL_IDS.DRAFTS]: c('Link').t`Drafts`,
    [MAILBOX_LABEL_IDS.STARRED]: c('Link').t`Starred`,
    [MAILBOX_LABEL_IDS.OUTBOX]: c('Link').t`Outbox`,
    [MAILBOX_LABEL_IDS.SCHEDULED]: c('Link').t`Scheduled`,
});

// List of location where messages are marked automatically as read after moving by the API
export const LABELS_AUTO_READ = [MAILBOX_LABEL_IDS.TRASH];

// List of location that cannot be change by user interaction
export const LABELS_UNMODIFIABLE_BY_USER = [
    MAILBOX_LABEL_IDS.ALL_MAIL,
    MAILBOX_LABEL_IDS.ALL_SENT,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.OUTBOX,
    MAILBOX_LABEL_IDS.SCHEDULED,
];

export enum ENCRYPTED_STATUS {
    PGP_MIME = 8, // Used for attachment
}

export enum LINK_TYPES {
    WEB = 'web',
    EMAIL = 'email',
    PHONE = 'phone',
}

export enum MESSAGE_ACTIONS {
    NEW = -1,
    REPLY = 0,
    REPLY_ALL = 1,
    FORWARD = 2,
}

export const MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM = `mailto`;
// Path: /inbox/#mailto=%s
export const MAILTO_PROTOCOL_HANDLER_PATH = `/${
    LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]
}/#${MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM}=%s`;

export enum SAVE_DRAFT_ERROR_CODES {
    MESSAGE_ALREADY_SENT = 15034,
    DRAFT_DOES_NOT_EXIST = 15033,
}

export enum SEND_EMAIL_ERROR_CODES {
    MESSAGE_ALREADY_SENT = 2500,
}

export enum UPLOAD_ATTACHMENT_ERROR_CODES {
    MESSAGE_ALREADY_SENT = 11114,
}

export const MESSAGE_ALREADY_SENT_INTERNAL_ERROR = 'Message already sent';

export const DRAG_ELEMENT_KEY = 'drag-element';
export const DRAG_ELEMENT_ID_KEY = 'drag-element-id';
export const DRAG_ADDRESS_KEY = 'drag-address';
export const DRAG_ADDRESS_SIZE_KEY = 'drag-address-size';

export const MAX_ELEMENT_LIST_LOAD_RETRIES = 3;

export const OPENPGP_REFRESH_CUTOFF = 10;
export const ES_MAX_PARALLEL_MESSAGES = 150;
export const ES_MAX_CONCURRENT = 10;
export const ES_MAX_CACHE = 500000000; // 500 MB
export const ES_MAX_PAGES_PER_BATCH = 100;
export const ES_MAX_MESSAGES_PER_BATCH = 1000;
export const ES_MAX_INITIAL_CHARS = 20;
export const AesKeyGenParams: AesKeyGenParams = { name: 'AES-GCM', length: 128 };
export const KeyUsages: KeyUsage[] = ['encrypt', `decrypt`];
export const localisedForwardFlags = [
    'fw:',
    'fwd:',
    'vs:',
    'προώθ:',
    'tr :',
    'trs:',
    'áfram:',
    'welleh:',
    'en:',
    'enc:',
    'redir:',
    'vb:',
    '转发：',
    '轉寄：',
    '转发:',
    '轉寄:',
    'doorst:',
    'wg:',
    'πρθ:',
    'továbbítás:',
    'i:',
    'fs:',
    'rv:',
    'pd:',
    'i̇lt:',
];
export const defaultESStatus: ESStatus = {
    permanentResults: [],
    setElementsCache: () => {},
    labelID: '',
    lastEmail: undefined,
    previousNormSearchParams: undefined,
    cachedIndexKey: undefined,
    dbExists: false,
    isBuilding: false,
    isDBLimited: false,
    esEnabled: false,
    isRefreshing: false,
    isSearchPartial: false,
    isSearching: false,
    isCaching: false,
    isFirstSearch: true,
    dropdownOpened: false,
    temporaryToggleOff: false,
};
export const defaultESCache: ESCache = {
    esCache: [],
    cacheSize: 0,
    isCacheLimited: true,
    isCacheReady: false,
};
export const defaultESIndexingState: ESIndexingState = {
    esProgress: 0,
    estimatedMinutes: 0,
    startTime: 0,
    endTime: 0,
    oldestTime: 0,
    esPrevProgress: 0,
    totalIndexingMessages: 0,
    currentProgressValue: 0,
};

export const WELCOME_PANE_OPTIONS_URLS = {
    plansSelection: '/dashboard',
    protonShop: 'https://shop.protonmail.com',
    proton2FA: 'https://protonmail.com/support/knowledge-base/two-factor-authentication/',
    protonBusiness: 'https://protonmail.com/business/',
    calendar: 'https://calendar.protonmail.com',
    vpn: 'https://account.protonmail.com/u/6/vpn/vpn-apps',
};

export const restoringEncryptedMessagesURL =
    'https://protonmail.com/support/knowledge-base/restoring-encrypted-mailbox/';
export const reActivateKeySettingsURL = '/encryption-keys';

export const emailTrackerProtectionURL = 'https://protonmail.com/support/email-tracker-protection';

// Used for main action such as "label as", "move to" and "mark as read/unread"
export const SUCCESS_NOTIFICATION_EXPIRATION = 7500;

export const EO_REDIRECT_PATH = '/eo';
export const EO_MESSAGE_REDIRECT_PATH = `${EO_REDIRECT_PATH}/message`;
export const EO_REPLY_REDIRECT_PATH = `${EO_REDIRECT_PATH}/reply`;

export const EO_MAX_REPLIES_NUMBER = 5;

// Keys used for secure session storage
export const EO_TOKEN_KEY = 'proton:eo_token';
export const EO_DECRYPTED_TOKEN_KEY = 'proton:eo_decrypted_token';
export const EO_PASSWORD_KEY = 'proton:eo_password';

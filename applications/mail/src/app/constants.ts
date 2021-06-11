import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { CachedMessage, ESDBStatus, ESSearchStatus } from './models/encryptedSearch';

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

export const UNDO_SEND_DELAY = 5000;

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
};

export const HUMAN_TO_LABEL_IDS = Object.entries(LABEL_IDS_TO_HUMAN).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, Object.create(null));

export const LABEL_IDS_TO_I18N = {
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
};

// List of location where messages are marked automatically as read after moving by the API
export const LABELS_AUTO_READ = [MAILBOX_LABEL_IDS.TRASH];

// List of location that cannot be change by user interaction
export const LABELS_UNMODIFIABLE_BY_USER = [
    MAILBOX_LABEL_IDS.ALL_MAIL,
    MAILBOX_LABEL_IDS.ALL_SENT,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.OUTBOX,
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

export const DRAG_ELEMENT_KEY = 'drag-element';
export const DRAG_ELEMENT_ID_KEY = 'drag-element-id';
export const DRAG_ADDRESS_KEY = 'drag-address';
export const DRAG_ADDRESS_SIZE_KEY = 'drag-address-size';

export const MAX_ELEMENT_LIST_LOAD_RETRIES = 3;

export const OPENPGP_REFRESH_CUTOFF = 10;
export const ES_LIMIT = 150;
export const ES_MAX_CONCURRENT = 10;
export const ES_MAX_CACHE = 500000000; // 500 MB
export const ES_MAX_PAGEBATCH = 100;
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
export const defaultESDBStatus: ESDBStatus = {
    dbExists: false,
    isBuilding: false,
    isDBLimited: false,
    esEnabled: false,
    isCacheReady: false,
    isCacheLimited: false,
    isRefreshing: false,
};
export const defaultESSearchStatus: ESSearchStatus = {
    permanentResults: [],
    setElementsCache: () => {},
    labelID: '',
    cachePromise: (async () => [] as CachedMessage[])(),
};

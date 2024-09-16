import { SORT_DIRECTION } from '../constants';
import { isMobile } from '../helpers/browser';
import type { UserSettings } from '../interfaces/drive/userSettings';
import { LayoutSetting, SortSetting } from '../interfaces/drive/userSettings';

export const MB = 1024 * 1024;
export const FOLDER_PAGE_SIZE = 150;
export const BATCH_REQUEST_SIZE = 50;
export const FILE_CHUNK_SIZE = 4 * MB;
export const MEMORY_DOWNLOAD_LIMIT = (isMobile() ? 100 : 500) * MB;
export const HARDWARE_CONCURRENCY = (typeof window !== 'undefined' && window.navigator?.hardwareConcurrency) || 1;
// openpgp.js creates hardwareConcurrency of web workers to do decryption.
// Using less threads for download means we don't use available potential.
// Using more threads will not speed things up much because thread in this
// context is not real thread but concurrently running downloads in the main
// thread.
// In the future, with the openpgp.js v5, we will create web workers manually.
// That will allow us to create more workers and keep download and decryption
// part in the same thread to save some data exchanges between threads.
// We could really allow more workers than available CPUs, because decryption
// is done on the stream as data comes in, i.e., not that heavy operation.
// Of course, we cannot allow, lets say, twice as many workers per download
// of one file but for all downloads to not kill user's device. Ideally, we
// want to make download of one file as fast as possible, but limit it to the
// same speed with more ongoing downloads or uploads.
export const MAX_THREADS_PER_DOWNLOAD = HARDWARE_CONCURRENCY;
export const MAX_THREADS_PER_REQUEST = 5;
export const DEFAULT_SORT_FIELD = 'ModifyTime';
export const DEFAULT_SORT_ORDER: SORT_DIRECTION = SORT_DIRECTION.DESC;

export const DEFAULT_USER_SETTINGS: UserSettings = {
    Layout: LayoutSetting.List,
    Sort: SortSetting.ModifiedDesc,
    RevisionRetentionDays: 0,
    B2BPhotosEnabled: false,
};

export const UPLOAD_TIMEOUT = 90000;
export const DOWNLOAD_TIMEOUT = 90000;
export const DOWNLOAD_RETRIES_ON_TIMEOUT = 3;
export const EXPENSIVE_REQUEST_TIMEOUT = 60000;
export const MAX_NAME_LENGTH = 255;
export const MAX_SHARED_URL_PASSWORD_LENGTH = 50;

export const SHARE_GENERATED_PASSWORD_LENGTH = 12;

export const DEFAULT_SHARE_MAX_ACCESSES = 0; // Zero means unlimited.

export const MAX_SAFE_UPLOADING_FILE_COUNT = 500;
export const MAX_SAFE_UPLOADING_FILE_SIZE = 5 * 1024 * 1024 * 1024; // GB

export const CUSTOM_DATA_FORMAT = 'pd-custom';

export const THUMBNAIL_MAX_SIDE = 512; // in pixels
export const THUMBNAIL_MAX_SIZE = 60 * 1024; // in bytes, 60kB

export const HD_THUMBNAIL_MAX_SIDE = 1920; // in pixels
export const HD_THUMBNAIL_MAX_SIZE = 1024 * 1024; // in bytes, 1mB

export const THUMBNAIL_QUALITIES = [0.7, 0.5, 0.3, 0.1, 0]; // Used qualities to stick under THUMBNAIL_MAX_SIZE.

export const VIDEO_THUMBNAIL_MAX_TIME_LOCATION: number = 300; // In seconds

export enum LinkURLType {
    FOLDER = 'folder',
    FILE = 'file',
}

export enum EVENT_TYPES {
    DELETE = 0,
    CREATE = 1,
    UPDATE = 2,
    UPDATE_METADATA = 3,
}

export enum EXPIRATION_DAYS {
    NEVER = 'never',
    ONE = '1',
    FIFTEEN = '15',
    THIRTY = '30',
    SIXTY = '60',
    NINETY = '90',
}

/**
 * @deprecated common to different products, should be removed and use `API_CODES` from _/lib/constants.ts_ instead
 */
export enum RESPONSE_CODE {
    SUCCESS = 1000,
    NOT_ALLOWED = 2011,
    INVALID_REQUIREMENT = 2000,
    INVALID_LINK_TYPE = 2001,
    ALREADY_EXISTS = 2500,
    NOT_FOUND = 2501,
    INVALID_ID = 2061,
}

export enum SupportedMimeTypes {
    aac = 'audio/aac',
    apk = 'application/vnd.android.package-archive',
    apng = 'image/apng',
    arc = 'application/x-freearc',
    avi = 'video/x-msvideo',
    avif = 'image/avif',
    bmp = 'image/bmp',
    bzip2 = 'application/x-bzip2',
    cr3 = 'image/x-canon-cr3',
    docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    eot = 'application/vnd.ms-fontobject',
    epub = 'application/epub+zip',
    flac = 'audio/x-flac',
    flv = 'video/x-flv',
    gif = 'image/gif',
    gzip = 'application/gzip',
    heic = 'image/heic',
    heics = 'image/heic-sequence',
    heif = 'image/heif',
    heifs = 'image/heif-sequence',
    ico = 'image/x-icon',
    jpg = 'image/jpeg',
    jxl = 'image/jxl',
    keynote = 'application/vnd.apple.keynote',
    m4a = 'audio/x-m4a',
    m4v = 'video/x-m4v',
    midi = 'audio/midi',
    mp1s = 'video/MP1S',
    mp2p = 'video/MP2P',
    mp2t = 'video/mp2t',
    mp4a = 'audio/mp4',
    mp4v = 'video/mp4',
    mpeg = 'audio/mpeg',
    mpg = 'video/mpeg',
    numbers = 'application/vnd.apple.numbers',
    odp = 'application/vnd.oasis.opendocument.presentation',
    ods = 'application/vnd.oasis.opendocument.spreadsheet',
    odt = 'application/vnd.oasis.opendocument.text',
    oga = 'audio/ogg',
    ogg = 'application/ogg',
    ogv = 'video/ogg',
    opus = 'audio/opus',
    otf = 'font/otf',
    pages = 'application/vnd.apple.pages',
    pdf = 'application/pdf',
    png = 'image/png',
    pptx = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    qcp = 'audio/qcelp',
    qt = 'video/quicktime',
    rar = 'application/vnd.rar',
    rtf = 'application/rtf',
    svg = 'image/svg+xml',
    swf = 'application/x-shockwave-flash',
    tar = 'application/x-tar',
    tiff = 'image/tiff',
    ttf = 'font/ttf',
    v3g2 = 'video/3gpp2',
    v3gp = 'video/3gpp',
    wav = 'audio/wav',
    webp = 'image/webp',
    woff = 'font/woff',
    woff2 = 'font/woff2',
    x7zip = 'application/x-7z-compressed',
    xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xml = 'text/xml',
    zip = 'application/zip',
    vdnMicrosoftIcon = 'image/vnd.microsoft.icon',
}

export enum SupportedProtonDocsMimeTypes {
    docx = SupportedMimeTypes.docx,
    txt = 'text/plain',
    md = 'text/markdown',
    html = 'text/html',
}

export const EXTRA_EXTENSION_TYPES: { [ext: string]: string } = {
    py: 'text/x-python',
    ts: 'application/typescript',
    jxl: 'image/jxl',
};

export enum SHARE_MEMBER_PERMISSIONS {
    READ = 4,
    WRITE = 2,
    ADMIN = 16,
    SUPER_ADMIN = 32,
    OWNER = 55,
}

export enum SHARE_MEMBER_STATE {
    PENDING = 1,
    REJECTED = 2,
    DELETED = 3,
}

export enum SHARE_EXTERNAL_INVITATION_STATE {
    PENDING = 1,
    USER_REGISTERED = 2,
}

export const DS_STORE = '.DS_Store';

// Delete once sharing between members is fully implemented.
export const MEMBER_SHARING_ENABLED = false;

export const PHOTOS_PAGE_SIZE = 500;

// Accepted files for photos. This value must be used in input `accept` attribute
export const PHOTOS_ACCEPTED_INPUT = `image/*,video/*,${SupportedMimeTypes.heic},${SupportedMimeTypes.heif}`;

const HOURS_IN_MS = 60 * 60 * 1000;
export const ACTIVE_PING_INTERVAL = 6 * HOURS_IN_MS;

export enum DRIVE_SIGNATURE_CONTEXT {
    SHARE_MEMBER_INVITER = 'drive.share-member.inviter',
    SHARE_MEMBER_MEMBER = 'drive.share-member.member',
    SHARE_MEMBER_EXTERNAL_INVITATION = 'drive.share-member.external-invitation',
}

export const SHARE_INVITE_MESSAGE_MAX_LENGTH = 500;

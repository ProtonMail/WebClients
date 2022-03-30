import { isMobile } from '../helpers/browser';
import { SORT_DIRECTION } from '../constants';
import { LayoutSetting, SortSetting, UserSettings } from '../interfaces/drive/userSettings';
import { DriveSectionSortKeys, SharedLinksSectionSortKeys, SortParams } from '../interfaces/drive/link';

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
export const DEFAULT_SORT_ORDER = SORT_DIRECTION.DESC;
export const DEFAULT_SORT_PARAMS_DRIVE: SortParams<DriveSectionSortKeys> = {
    sortField: DEFAULT_SORT_FIELD,
    sortOrder: DEFAULT_SORT_ORDER,
};
export const DEFAULT_SORT_PARAMS_SHARED_LINKS: SortParams<SharedLinksSectionSortKeys> = {
    sortField: 'CreateTime',
    sortOrder: DEFAULT_SORT_ORDER,
};
export const DEFAULT_USER_SETTINGS: UserSettings = {
    Layout: LayoutSetting.List,
    Sort: SortSetting.ModifiedDesc,
};
export const UPLOAD_TIMEOUT = 90000;
export const DOWNLOAD_TIMEOUT = 90000;
export const DOWNLOAD_RETRIES_ON_TIMEOUT = 3;
export const EXPENSIVE_REQUEST_TIMEOUT = 60000;
export const MAX_NAME_LENGTH = 255;
export const MIN_SHARED_URL_PASSWORD_LENGTH = 8;

export const SHARE_GENERATED_PASSWORD_LENGTH = 12;
export const DEFAULT_SHARE_MAX_ACCESSES = 10000;

export const MAX_SAFE_UPLOADING_FILE_COUNT = 500;

export const CUSTOM_DATA_FORMAT = 'pd-custom';

export const THUMBNAIL_MAX_SIDE = 256; // in pixels
export const THUMBNAIL_MAX_SIZE = 16 * 1024; // in bytes, 16kB
export const THUMBNAIL_QUALITIES = [0.7, 0.5, 0.3, 0.1, 0]; // Used qualities to stick under THUMBNAIL_MAX_SIZE.

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

export enum RESPONSE_CODE {
    SUCCESS = 1000,
    NOT_ALLOWED = 2011,
    INVALID_REQUIREMENT = 2000,
    ALREADY_EXISTS = 2500,
    NOT_FOUND = 2501,
    INVALID_ID = 2061,
}

export enum SupportedMimeTypes {
    flac = 'audio/x-flac',
    mp2t = 'video/mp2t',
    gzip = 'application/gzip',
    bmp = 'image/bmp',
    tar = 'application/x-tar',
    rar = 'application/vnd.rar',
    swf = 'application/x-shockwave-flash',
    rtf = 'application/rtf',
    bzip2 = 'application/x-bzip2',
    eot = 'application/vnd.ms-fontobject',
    png = 'image/png',
    pdf = 'application/pdf',
    apng = 'image/apng',
    gif = 'image/gif',
    jpg = 'image/jpeg',
    ico = 'image/x-icon',
    tiff = 'image/tiff',
    mpg = 'video/mpeg',
    arc = 'application/x-freearc',
    otf = 'font/otf',
    ogg = 'application/ogg',
    ogv = 'video/ogg',
    oga = 'audio/ogg',
    opus = 'audio/opus',
    midi = 'audio/midi',
    ttf = 'font/ttf',
    wav = 'audio/wav',
    avi = 'video/x-msvideo',
    qcp = 'audio/qcelp',
    webp = 'image/webp',
    woff = 'font/woff',
    woff2 = 'font/woff2',
    xml = 'text/xml',
    x7zip = 'application/x-7z-compressed',
    aac = 'audio/aac',
    mpeg = 'audio/mpeg',
    zip = 'application/zip',
    docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    epub = 'application/epub+zip',
    odt = 'application/vnd.oasis.opendocument.text',
    ods = 'application/vnd.oasis.opendocument.spreadsheet',
    odp = 'application/vnd.oasis.opendocument.presentation',
    flv = 'video/x-flv',
    avif = 'image/avif',
    heif = 'image/heif',
    heifs = 'image/heif-sequence',
    heic = 'image/heic',
    heics = 'image/heic-sequence',
    cr3 = 'image/x-canon-cr3',
    qt = 'video/quicktime',
    m4v = 'video/x-m4v',
    mp4v = 'video/mp4',
    m4a = 'audio/x-m4a',
    mp4a = 'audio/mp4',
    v3g2 = 'video/3gpp2',
    v3gp = 'video/3gpp',
    mp1s = 'video/MP1S',
    mp2p = 'video/MP2P',
}

export const EXTRA_EXTENSION_TYPES: { [ext: string]: string } = {
    py: 'text/x-python',
    ts: 'application/typescript',
};

export const fileDescriptions: { [type: string]: string } = {
    [SupportedMimeTypes.aac]: 'AAC audio',
    [SupportedMimeTypes.avi]: 'AVI: Audio Video Interleave',
    [SupportedMimeTypes.bmp]: 'Windows OS/2 Bitmap Graphics',
    [SupportedMimeTypes.bzip2]: 'BZip2 archive',
    [SupportedMimeTypes.docx]: 'Microsoft Word (OpenXML)',
    [SupportedMimeTypes.eot]: 'MS Embedded OpenType fonts',
    [SupportedMimeTypes.epub]: 'Electronic publication (EPUB)',
    [SupportedMimeTypes.gzip]: 'GZip Compressed Archive',
    [SupportedMimeTypes.gif]: 'Graphics Interchange Format (GIF)',
    [SupportedMimeTypes.ico]: 'Icon format',
    [SupportedMimeTypes.jpg]: 'JPEG images',
    [SupportedMimeTypes.midi]: 'Musical Instrument Digital Interface (MIDI)',
    [SupportedMimeTypes.mpeg]: 'MP3 audio',
    [SupportedMimeTypes.mpg]: 'MPEG Video',
    [SupportedMimeTypes.odp]: 'OpenDocument presentation document',
    [SupportedMimeTypes.ods]: 'OpenDocument spreadsheet document',
    [SupportedMimeTypes.odt]: 'OpenDocument text document',
    [SupportedMimeTypes.oga]: 'OGG audio',
    [SupportedMimeTypes.ogv]: 'OGG video',
    [SupportedMimeTypes.ogg]: 'OGG',
    [SupportedMimeTypes.opus]: 'Opus audio',
    [SupportedMimeTypes.otf]: 'OpenType font',
    [SupportedMimeTypes.png]: 'Portable Network Graphics',
    [SupportedMimeTypes.apng]: 'Animated Portable Network Graphics',
    [SupportedMimeTypes.pdf]: 'Adobe Portable Document Format (PDF)',
    [SupportedMimeTypes.pptx]: 'Microsoft PowerPoint (OpenXML)',
    [SupportedMimeTypes.rar]: 'RAR archive',
    [SupportedMimeTypes.rtf]: 'Rich Text Format (RTF)',
    [SupportedMimeTypes.swf]: 'Small web format (SWF)',
    [SupportedMimeTypes.flv]: 'Flash Video',
    [SupportedMimeTypes.tar]: 'Tape Archive (TAR)',
    [SupportedMimeTypes.tiff]: 'Tagged Image File Format (TIFF)',
    [SupportedMimeTypes.mp2t]: 'MPEG transport stream',
    [SupportedMimeTypes.ttf]: 'TrueType Font',
    [SupportedMimeTypes.webp]: 'WEBP image',
    [SupportedMimeTypes.woff]: 'Web Open Font Format (WOFF)',
    [SupportedMimeTypes.woff2]: 'Web Open Font Format (WOFF)',
    [SupportedMimeTypes.xlsx]: 'Microsoft Excel (OpenXML)',
    [SupportedMimeTypes.xml]: 'XML',
    [SupportedMimeTypes.zip]: 'ZIP archive',
    [SupportedMimeTypes.wav]: 'Waveform Audio Format',
    [SupportedMimeTypes.v3gp]: '3GPP audio/video container',
    [SupportedMimeTypes.v3g2]: '3GPP2 audio/video container',
    [SupportedMimeTypes.x7zip]: '7-zip archive',
    'audio/x-midi': 'Musical Instrument Digital Interface (MIDI)',
    'image/vnd.microsoft.icon': 'Icon format',
    'application/x-bzip': 'BZip archive',
    'application/x-abiword': 'AbiWord document',
    'application/x-freearc': 'Archive document',
    'application/vnd.amazon.ebook': 'Amazon Kindle eBook format',
    'application/octet-stream': 'Binary',
    'application/x-csh': 'C-Shell script',
    'text/x-csh': 'C-Shell script',
    'text/css': 'Cascading Style Sheets (CSS)',
    'text/csv': 'Comma-separated values (CSV)',
    'application/msword': 'Microsoft Word',
    'text/html': 'HyperText Markup Language (HTML)',
    'text/calendar': 'iCalendar format',
    'application/java-archive': 'Java Archive (JAR)',
    'text/javascript': 'JavaScript',
    'application/javascript': 'JavaScript',
    'application/json': 'JSON format',
    'application/ld+json': 'JSON-LD format',
    'application/vnd.apple.installer+xml': 'Apple Installer Package',
    'application/x-httpd-php': 'Hypertext Preprocessor (Personal Home Page)',
    'application/vnd.ms-powerpoint': 'Microsoft PowerPoint',
    'application/x-sh': 'Bourne shell script',
    'image/svg+xml': 'Scalable Vector Graphics (SVG)',
    'text/plain': 'Text',
    'application/vnd.visio': 'Microsoft Visio',
    'audio/webm': 'WEBM audio',
    'video/webm': 'WEBM video',
    'application/xhtml+xml': 'XHTML',
    'application/vnd.ms-excel': 'Microsoft Excel',
    'application/xml': 'XML',
    'application/vnd.mozilla.xul+xml': 'XUL',
    'audio/3gpp': '3GPP audio/video container',
    'audio/3gpp2': '3GPP2 audio/video container',
    'text/x-python': 'Python',
    'application/typescript': 'TypeScript',
};

// Delete once sharing between members is fully implemented.
export const MEMBER_SHARING_ENABLED = false;

import { isMobile } from 'proton-shared/lib/helpers/browser';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { SortParams } from './interfaces/link';

export const MB = 1024 * 1024;
export const FOLDER_PAGE_SIZE = 150;
export const BATCH_REQUEST_SIZE = 150;
export const FILE_CHUNK_SIZE = 4 * MB;
export const MEMORY_DOWNLOAD_LIMIT = (isMobile() ? 100 : 1000) * MB;
export const MAX_THREADS_PER_DOWNLOAD = 3;
export const MAX_THREADS_PER_REQUEST = 5;
export const DEFAULT_SORT_FIELD = 'ModifyTime';
export const DEFAULT_SORT_ORDER = SORT_DIRECTION.ASC;
export const DEFAULT_SORT_PARAMS: SortParams = {
    sortField: DEFAULT_SORT_FIELD,
    sortOrder: DEFAULT_SORT_ORDER,
};
export const UPLOAD_TIMEOUT = 60000;
export const DOWNLOAD_TIMEOUT = 60000;
export const EXPENSIVE_REQUEST_TIMEOUT = 60000;
export const MAX_NAME_LENGTH = 255;

export const CUSTOM_DATA_FORMAT = 'pd-custom';

export const MIMETYPE_DESCRIPTION_MAP: { [key: string]: string } = {
    'audio/aac': 'AAC audio',
    'application/x-abiword': 'AbiWord document',
    'application/x-freearc': 'Archive document (multiple files embedded)',
    'video/x-msvideo': 'AVI: Audio Video Interleave',
    'application/vnd.amazon.ebook': 'Amazon Kindle eBook format',
    'application/octet-stream': 'Any kind of binary data',
    'image/bmp': 'Windows OS/2 Bitmap Graphics',
    'application/x-bzip': 'BZip archive',
    'application/x-bzip2': 'BZip2 archive',
    'application/x-csh': 'C-Shell script',
    'text/css': 'Cascading Style Sheets (CSS)',
    'text/csv': 'Comma-separated values (CSV)',
    'application/msword': 'Microsoft Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Microsoft Word (OpenXML)',
    'application/vnd.ms-fontobject': 'MS Embedded OpenType fonts',
    'application/epub+zip': 'Electronic publication (EPUB)',
    'application/gzip': 'GZip Compressed Archive',
    'image/gif': 'Graphics Interchange Format (GIF)',
    'text/html': 'HyperText Markup Language (HTML)',
    'image/vnd.microsoft.icon': 'Icon format',
    'text/calendar': 'iCalendar format',
    'application/java-archive': 'Java Archive (JAR)',
    'image/jpeg': 'JPEG images',
    'text/javascript': 'JavaScript',
    'application/json': 'JSON format',
    'application/ld+json': 'JSON-LD format',
    'audio/midi': 'Musical Instrument Digital Interface (MIDI)',
    'audio/x-midi': 'Musical Instrument Digital Interface (MIDI)',
    'audio/mpeg': 'MP3 audio',
    'video/mpeg': 'MPEG Video',
    'application/vnd.apple.installer+xml': 'Apple Installer Package',
    'application/vnd.oasis.opendocument.presentation': 'OpenDocument presentation document',
    'application/vnd.oasis.opendocument.spreadsheet': 'OpenDocument spreadsheet document',
    'application/vnd.oasis.opendocument.text': 'OpenDocument text document',
    'audio/ogg': 'OGG audio',
    'video/ogg': 'OGG video',
    'application/ogg': 'OGG',
    'audio/opus': 'Opus audio',
    'font/otf': 'OpenType font',
    'image/png': 'Portable Network Graphics',
    'application/pdf': 'Adobe Portable Document Format (PDF)',
    'application/x-httpd-php': 'Hypertext Preprocessor (Personal Home Page)',
    'application/vnd.ms-powerpoint': 'Microsoft PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Microsoft PowerPoint (OpenXML)',
    'application/vnd.rar': 'RAR archive',
    'application/rtf': 'Rich Text Format (RTF)',
    'application/x-sh': 'Bourne shell script',
    'image/svg+xml': 'Scalable Vector Graphics(SVG)',
    'application/x-shockwave-flash': 'Small web format (SWF) or Adobe Flash document',
    'application/x-tar': 'Tape Archive (TAR)',
    'image/tiff': 'Tagged Image File Format (TIFF)',
    'video/mp2t': 'MPEG transport stream',
    'font/ttf': 'TrueType Font',
    'text/plain': 'Text, (generally ASCII or ISO 8859-n)',
    'application/vnd.visio': 'Microsoft Visio',
    'audio/wav': 'Waveform Audio Format',
    'audio/webm': 'WEBM audio',
    'video/webm': 'WEBM video',
    'image/webp': 'WEBP image',
    'font/woff': 'Web Open Font Format (WOFF)',
    'font/woff2': 'Web Open Font Format (WOFF)',
    'application/xhtml+xml': 'XHTML',
    'application/vnd.ms-excel': 'Microsoft Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Microsoft Excel (OpenXML)',
    'application/xml': 'XML',
    'text/xml': 'XML',
    'application/vnd.mozilla.xul+xml': 'XUL',
    'application/zip': 'ZIP archive',
    'video/3gpp': '3GPP audio/video container',
    'audio/3gpp': '3GPP audio/video container',
    'video/3gpp2': '3GPP2 audio/video container',
    'audio/3gpp2': '3GPP2 audio/video container',
    'application/x-7z-compressed': '7-zip archive',
};

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

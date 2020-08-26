import { c } from 'ttag';

import { LinkType, LinkMeta } from '../../interfaces/link';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import { LinkURLType } from '../../constants';

export const selectMessageForItemList = (
    types: LinkType[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    }
) => {
    const allFiles = types.every((type) => type === LinkType.FILE);
    const allFolders = types.every((type) => type === LinkType.FOLDER);
    const message = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

    return message;
};

export const mapLinksToChildren = (
    decryptedLinks: LinkMeta[],
    isDisabled: (linkId: string) => boolean
): FileBrowserItem[] => {
    return decryptedLinks.map(({ LinkID, Type, Name, ModifyTime, Size, MIMEType, ParentLinkID, Trashed }) => ({
        Name,
        LinkID,
        Type,
        ModifyTime,
        Size,
        MIMEType,
        ParentLinkID,
        Trashed,
        Disabled: isDisabled(LinkID),
    }));
};

export const toLinkURLType = (type: LinkType) => {
    const linkType = {
        [LinkType.FILE]: LinkURLType.FILE,
        [LinkType.FOLDER]: LinkURLType.FOLDER,
    }[type];

    if (!linkType) {
        throw new Error(`Type ${type} is unexpected, must be integer representing link type`);
    }

    return linkType;
};

export const getMimeTypeDescription = (mimeType: string) => {
    const descriptions: { [type: string]: string } = {
        'audio/aac': c('Label').t`AAC audio`,
        'application/x-abiword': c('Label').t`AbiWord document`,
        'application/x-freearc': c('Label').t`Archive document`,
        'video/x-msvideo': c('Label').t`AVI: Audio Video Interleave`,
        'application/vnd.amazon.ebook': c('Label').t`Amazon Kindle eBook format`,
        'application/octet-stream': c('Label').t`Binary`,
        'image/bmp': c('Label').t`Windows OS/2 Bitmap Graphics`,
        'application/x-bzip': c('Label').t`BZip archive`,
        'application/x-bzip2': c('Label').t`BZip2 archive`,
        'application/x-csh': c('Label').t`C-Shell script`,
        'text/css': c('Label').t`Cascading Style Sheets (CSS)`,
        'text/csv': c('Label').t`Comma-separated values (CSV)`,
        'application/msword': c('Label').t`Microsoft Word`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': c('Label')
            .t`Microsoft Word (OpenXML)`,
        'application/vnd.ms-fontobject': c('Label').t`MS Embedded OpenType fonts`,
        'application/epub+zip': c('Label').t`Electronic publication (EPUB)`,
        'application/gzip': c('Label').t`GZip Compressed Archive`,
        'image/gif': c('Label').t`Graphics Interchange Format (GIF)`,
        'text/html': c('Label').t`HyperText Markup Language (HTML)`,
        'image/vnd.microsoft.icon': c('Label').t`Icon format`,
        'text/calendar': c('Label').t`iCalendar format`,
        'application/java-archive': c('Label').t`Java Archive (JAR)`,
        'image/jpeg': c('Label').t`JPEG images`,
        'text/javascript': c('Label').t`JavaScript`,
        'application/javascript': c('Label').t`JavaScript`,
        'application/json': c('Label').t`JSON format`,
        'application/ld+json': c('Label').t`JSON-LD format`,
        'audio/midi': c('Label').t`Musical Instrument Digital Interface (MIDI)`,
        'audio/x-midi': c('Label').t`Musical Instrument Digital Interface (MIDI)`,
        'audio/mpeg': c('Label').t`MP3 audio`,
        'video/mpeg': c('Label').t`MPEG Video`,
        'application/vnd.apple.installer+xml': c('Label').t`Apple Installer Package`,
        'application/vnd.oasis.opendocument.presentation': c('Label').t`OpenDocument presentation document`,
        'application/vnd.oasis.opendocument.spreadsheet': c('Label').t`OpenDocument spreadsheet document`,
        'application/vnd.oasis.opendocument.text': c('Label').t`OpenDocument text document`,
        'audio/ogg': c('Label').t`OGG audio`,
        'video/ogg': c('Label').t`OGG video`,
        'application/ogg': c('Label').t`OGG`,
        'audio/opus': c('Label').t`Opus audio`,
        'font/otf': c('Label').t`OpenType font`,
        'image/png': c('Label').t`Portable Network Graphics`,
        'application/pdf': c('Label').t`Adobe Portable Document Format (PDF)`,
        'application/x-httpd-php': c('Label').t`Hypertext Preprocessor (Personal Home Page)`,
        'application/vnd.ms-powerpoint': c('Label').t`Microsoft PowerPoint`,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': c('Label')
            .t`Microsoft PowerPoint (OpenXML)`,
        'application/vnd.rar': c('Label').t`RAR archive`,
        'application/rtf': c('Label').t`Rich Text Format (RTF)`,
        'application/x-sh': c('Label').t`Bourne shell script`,
        'image/svg+xml': c('Label').t`Scalable Vector Graphics(SVG)`,
        'application/x-shockwave-flash': c('Label').t`Small web format (SWF)`,
        'application/x-tar': c('Label').t`Tape Archive (TAR)`,
        'image/tiff': c('Label').t`Tagged Image File Format (TIFF)`,
        'video/mp2t': c('Label').t`MPEG transport stream`,
        'font/ttf': c('Label').t`TrueType Font`,
        'text/plain': c('Label').t`Text`,
        'application/vnd.visio': c('Label').t`Microsoft Visio`,
        'audio/wav': c('Label').t`Waveform Audio Format`,
        'audio/webm': c('Label').t`WEBM audio`,
        'video/webm': c('Label').t`WEBM video`,
        'image/webp': c('Label').t`WEBP image`,
        'font/woff': c('Label').t`Web Open Font Format (WOFF)`,
        'font/woff2': c('Label').t`Web Open Font Format (WOFF)`,
        'application/xhtml+xml': c('Label').t`XHTML`,
        'application/vnd.ms-excel': c('Label').t`Microsoft Excel`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': c('Label').t`Microsoft Excel (OpenXML)`,
        'application/xml': c('Label').t`XML`,
        'text/xml': c('Label').t`XML`,
        'application/vnd.mozilla.xul+xml': c('Label').t`XUL`,
        'application/zip': c('Label').t`ZIP archive`,
        'video/3gpp': c('Label').t`3GPP audio/video container`,
        'audio/3gpp': c('Label').t`3GPP audio/video container`,
        'video/3gpp2': c('Label').t`3GPP2 audio/video container`,
        'audio/3gpp2': c('Label').t`3GPP2 audio/video container`,
        'application/x-7z-compressed': c('Label').t`7-zip archive`,
    };

    if (descriptions[mimeType]) {
        return descriptions[mimeType];
    }
    if (mimeType.startsWith('audio/')) {
        return c('Label').t`Audio file`;
    }
    if (mimeType.startsWith('video/')) {
        return c('Label').t`Video file`;
    }
    if (mimeType.startsWith('text/')) {
        return c('Label').t`Text`;
    }
    if (mimeType.startsWith('image/')) {
        return c('Label').t`Image`;
    }

    return c('Label').t`Unknown file`;
};

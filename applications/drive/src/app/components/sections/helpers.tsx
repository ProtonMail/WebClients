import { c } from 'ttag';

import { LinkURLType, SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { DecryptedLink } from '../../store';
import type { SharedWithMeItem } from './SharedWithMe/SharedWithMe';

export const selectMessageForItemList = (
    isFiles: boolean[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    }
) => {
    const allFiles = isFiles.every((isFile) => isFile);
    const allFolders = isFiles.every((isFile) => !isFile);
    const message = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

    return message;
};

export const toLinkURLType = (isFile: boolean) => {
    return isFile ? LinkURLType.FILE : LinkURLType.FOLDER;
};

export const getLocalizedDescription = (mimeType: string): string | undefined => {
    switch (mimeType) {
        // Compressed archives
        case 'application/java-archive':
            return c('Mimetype').t`Java Archive (JAR)`;
        case 'application/x-bzip':
            return c('Mimetype').t`BZip archive`;
        case SupportedMimeTypes.bzip2:
            return c('Mimetype').t`BZip2 archive`;
        case 'application/x-freearc':
            return c('Mimetype').t`Archive document`;
        case SupportedMimeTypes.gzip:
            return c('Mimetype').t`GZip Compressed Archive`;
        case SupportedMimeTypes.rar:
            return c('Mimetype').t`RAR archive`;
        case SupportedMimeTypes.zip:
            return c('Mimetype').t`ZIP archive`;
        case SupportedMimeTypes.tar:
            return c('Mimetype').t`Tape Archive (TAR)`;
        case SupportedMimeTypes.x7zip:
            return c('Mimetype').t`7-zip archive`;

        // Text files
        case 'text/plain':
            return c('Mimetype').t`Text`;
        case 'application/javascript':
        case 'text/javascript':
            return c('Mimetype').t`JavaScript`;
        case 'application/typescript':
            return c('Mimetype').t`TypeScript`;
        case 'application/json':
            return c('Mimetype').t`JSON`;
        case 'application/ld+json':
            return c('Mimetype').t`JSON-LD`;
        case 'application/vnd.mozilla.xul+xml':
            return c('Mimetype').t`XUL`;
        case 'application/x-csh':
        case 'text/x-csh':
            return c('Mimetype').t`C-Shell script`;
        case 'application/x-sh':
            return c('Mimetype').t`Bourne shell script`;
        case 'application/x-httpd-php':
            return c('Mimetype').t`Hypertext Preprocessor (Personal Home Page)`;
        case 'application/xhtml+xml':
            return c('Mimetype').t`XHTML`;
        case 'application/xml':
        case SupportedMimeTypes.xml:
            return c('Mimetype').t`XML`;
        case 'text/css':
            return c('Mimetype').t`Cascading Style Sheets (CSS)`;
        case 'text/csv':
            return c('Mimetype').t`Comma-separated values (CSV)`;
        case 'text/html':
            return c('Mimetype').t`HyperText Markup Language (HTML)`;
        case 'text/x-python':
            return c('Mimetype').t`Python`;

        // Documents
        case SupportedMimeTypes.docx:
            return c('Mimetype').t`Microsoft Word (OpenXML)`;
        case 'application/msword':
            return c('Mimetype').t`Microsoft Word`;
        case SupportedMimeTypes.xlsx:
            return c('Mimetype').t`Microsoft Excel (OpenXML)`;
        case 'application/vnd.ms-excel':
            return c('Mimetype').t`Microsoft Excel`;
        case SupportedMimeTypes.pptx:
            return c('Mimetype').t`Microsoft PowerPoint (OpenXML)`;
        case 'application/vnd.ms-powerpoint':
            return c('Mimetype').t`Microsoft PowerPoint`;
        case 'application/vnd.visio':
            return c('Mimetype').t`Microsoft Visio`;
        case 'application/x-abiword':
            return c('Mimetype').t`AbiWord document`;
        case 'application/vnd.amazon.ebook':
            return c('Mimetype').t`Amazon Kindle eBook format`;
        case SupportedMimeTypes.epub:
            return c('Mimetype').t`Electronic publication (EPUB)`;
        case SupportedMimeTypes.keynote:
            return c('Mimetype').t`Apple Keynote`;
        case SupportedMimeTypes.numbers:
            return c('Mimetype').t`Apple Numbers`;
        case SupportedMimeTypes.odp:
            return c('Mimetype').t`OpenDocument presentation document`;
        case SupportedMimeTypes.ods:
            return c('Mimetype').t`OpenDocument spreadsheet document`;
        case SupportedMimeTypes.odt:
            return c('Mimetype').t`OpenDocument text document`;
        case SupportedMimeTypes.pages:
            return c('Mimetype').t`Apple Pages`;
        case SupportedMimeTypes.pdf:
        case 'application/x-pdf':
            return c('Mimetype').t`Adobe Portable Document Format (PDF)`;
        case SupportedMimeTypes.rtf:
            return c('Mimetype').t`Rich Text Format (RTF)`;

        // Applications
        case 'application/octet-stream':
            return c('Mimetype').t`Binary data`;
        case 'application/vnd.apple.installer+xml':
            return c('Mimetype').t`Apple Installer Package`;
        case SupportedMimeTypes.apk:
            return c('Mimetype').t`Android Package`;

        // Media
        case 'audio/3gpp':
            return c('Mimetype').t`3GPP audio/video container`;
        case 'audio/3gpp2':
            return c('Mimetype').t`3GPP2 audio/video container`;
        case 'audio/webm':
            return c('Mimetype').t`WEBM audio`;
        case 'audio/x-midi':
        case SupportedMimeTypes.midi:
            return c('Mimetype').t`Musical Instrument Digital Interface (MIDI)`;
        case SupportedMimeTypes.vdnMicrosoftIcon:
            return c('Mimetype').t`Icon format`;
        case 'video/webm':
            return c('Mimetype').t`WEBM video`;
        case SupportedMimeTypes.aac:
            return c('Mimetype').t`AAC audio`;
        case SupportedMimeTypes.apng:
            return c('Mimetype').t`Animated Portable Network Graphics`;
        case SupportedMimeTypes.avi:
            return c('Mimetype').t`AVI video`;
        case SupportedMimeTypes.bmp:
            return c('Mimetype').t`Windows OS/2 Bitmap Graphics`;
        case SupportedMimeTypes.flv:
            return c('Mimetype').t`Flash Video`;
        case SupportedMimeTypes.gif:
            return c('Mimetype').t`Graphics Interchange Format (GIF)`;
        case SupportedMimeTypes.ico:
            return c('Mimetype').t`Icon format`;
        case SupportedMimeTypes.jpg:
            return c('Mimetype').t`JPEG images`;
        case SupportedMimeTypes.mp2t:
            return c('Mimetype').t`MPEG transport stream`;
        case SupportedMimeTypes.mpeg:
            return c('Mimetype').t`MP3 audio`;
        case SupportedMimeTypes.mpg:
            return c('Mimetype').t`MPEG Video`;
        case SupportedMimeTypes.oga:
            return c('Mimetype').t`OGG audio`;
        case SupportedMimeTypes.ogg:
            return c('Mimetype').t`OGG`;
        case SupportedMimeTypes.ogv:
            return c('Mimetype').t`OGG video`;
        case SupportedMimeTypes.opus:
            return c('Mimetype').t`Opus audio`;
        case SupportedMimeTypes.png:
            return c('Mimetype').t`Portable Network Graphics`;
        case SupportedMimeTypes.svg:
            return c('Mimetype').t`Scalable Vector Graphics (SVG)`;
        case SupportedMimeTypes.tiff:
            return c('Mimetype').t`Tagged Image File Format (TIFF)`;
        case SupportedMimeTypes.v3g2:
            return c('Mimetype').t`3GPP2 audio/video container`;
        case SupportedMimeTypes.v3gp:
            return c('Mimetype').t`3GPP audio/video container`;
        case SupportedMimeTypes.wav:
            return c('Mimetype').t`Waveform Audio Format`;
        case SupportedMimeTypes.webp:
            return c('Mimetype').t`WEBP image`;
        case SupportedMimeTypes.avif:
            return c('Mimetype').t`AV1 Image File Format (AVIF)`;

        // Other
        case 'text/calendar':
            return c('Mimetype').t`iCalendar format`;
        case SupportedMimeTypes.eot:
            return c('Mimetype').t`MS Embedded OpenType fonts`;
        case SupportedMimeTypes.otf:
            return c('Mimetype').t`OpenType font`;
        case SupportedMimeTypes.woff:
            return c('Mimetype').t`Web Open Font Format (WOFF)`;
        case SupportedMimeTypes.woff2:
            return c('Mimetype').t`Web Open Font Format (WOFF)`;
        case SupportedMimeTypes.ttf:
            return c('Mimetype').t`TrueType Font`;
        case SupportedMimeTypes.swf:
            return c('Mimetype').t`Small web format (SWF)`;
    }
};

export const getMimeTypeDescription = (mimeType: string) => {
    const description = getLocalizedDescription(mimeType);
    if (description) {
        return description;
    }

    if (mimeType.startsWith('audio/')) {
        return c('Mimetype').t`Audio file`;
    }
    if (mimeType.startsWith('video/')) {
        return c('Mimetype').t`Video file`;
    }
    if (mimeType.startsWith('text/')) {
        return c('Mimetype').t`Text`;
    }
    if (mimeType.startsWith('image/')) {
        return c('Mimetype').t`Image`;
    }

    return c('Mimetype').t`Unknown file`;
};

export const getSelectedItems = (
    items: DecryptedLink[],
    selectedItemIds: string[],
    key: 'linkId' | 'rootShareId' = 'linkId'
): DecryptedLink[] => {
    if (items) {
        return selectedItemIds
            .map((selectedItemId) => items.find(({ isLocked, ...item }) => !isLocked && selectedItemId === item[key]))
            .filter(isTruthy) as DecryptedLink[];
    }

    return [];
};

export const getSelectedSharedWithMeItems = (
    items: SharedWithMeItem[],
    selectedItemIds: string[]
): SharedWithMeItem[] => {
    if (items) {
        return selectedItemIds
            .map((selectedItemId) =>
                items.find(({ isLocked, ...item }) => !isLocked && selectedItemId === item.rootShareId)
            )
            .filter(isTruthy) as SharedWithMeItem[];
    }

    return [];
};

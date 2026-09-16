import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom';
import type { ExifTags } from 'exifreader';

import { formatExifDateTime } from './utils';

// For usage inside Web Workers, since DOMParser is not available
// @xmldom/xmldom is a ponyfill of DOMParser
if (typeof DOMParser !== 'undefined') {
    class CustomDOMParser extends DOMParser {
        constructor() {
            super({ onError: onErrorStopParsing });
        }
    }
    // @ts-ignore
    self.DOMParser = CustomDOMParser;
}

export const getFormattedDateTime = (exif?: ExifTags) => {
    if (!exif) {
        return undefined;
    }
    const sources = [exif.DateTimeOriginal, exif.DateTimeDigitized, exif.DateTime];
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (!source?.value[0]) {
            continue;
        }
        try {
            return formatExifDateTime(source.value[0]);
        } catch {
            continue;
        }
    }
    return undefined;
};

export const getCaptureDateTimeString = (exif?: ExifTags) => {
    try {
        const formattedDateTime = getFormattedDateTime(exif);
        return formattedDateTime ? new Date(formattedDateTime).toISOString() : undefined;
    } catch {
        return undefined;
    }
};


import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom';
import ExifReader from 'exifreader';
import type { ExpandedTags } from 'exifreader';

import { isImage, isSVG } from '@proton/shared/lib/helpers/mimetype';

if (typeof DOMParser !== 'undefined') {
    class CustomDOMParser extends DOMParser {
        constructor() {
            super({ onError: onErrorStopParsing });
        }
    }
    // @ts-ignore
    self.DOMParser = CustomDOMParser;
}

export const getExifInfo = async (file: File, mimeType: string): Promise<ExpandedTags | undefined> => {
    if (!isImage(mimeType) || isSVG(mimeType)) {
        return undefined;
    }

    const buffer = await file.arrayBuffer();

    try {
        return ExifReader.load(buffer, { expanded: true });
    } catch (err) {
        // If we can't read exif we can still continue
        // eslint-disable-next-line no-console
        console.warn('Cannot read exif data');
    }

    return undefined;
};

import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom';
import ExifReader from 'exifreader';
import type { ExpandedTags } from 'exifreader';

import { isImage, isSVG } from '@proton/shared/lib/helpers/mimetype';

// Parse XMP metadata with @xmldom/xmldom's parser passed explicitly to ExifReader, rather than
// overwriting the host's global DOMParser. The latter is a module-load side effect that clobbers
// DOMParser for everything else sharing the realm (e.g. jsdom in tests that transitively import this).
const domParser = new DOMParser({ onError: onErrorStopParsing });

export const getExifInfo = async (file: File, mimeType: string): Promise<ExpandedTags | undefined> => {
    if (!isImage(mimeType) || isSVG(mimeType)) {
        return undefined;
    }

    const buffer = await file.arrayBuffer();

    try {
        return ExifReader.load(buffer, { expanded: true, domParser });
    } catch (err) {
        // If we can't read exif we can still continue

        console.warn('Cannot read exif data');
    }

    return undefined;
};

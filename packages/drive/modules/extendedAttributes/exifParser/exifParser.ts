import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom';
import ExifReader from 'exifreader';
import type { ExpandedTags } from 'exifreader';

import { isImage, isSVG } from '@proton/shared/lib/helpers/mimetype';

// Parse XMP metadata with @xmldom/xmldom's parser passed explicitly to ExifReader, rather than
// overwriting the host's global DOMParser. The latter is a module-load side effect that clobbers
// DOMParser for everything else sharing the realm (e.g. jsdom in tests that transitively import this).
const domParser = new DOMParser({ onError: onErrorStopParsing });

// Above this size, only the head of the file is read: reading a multi-GB file whole
// allocates it outside the JS heap and crashes the tab. Metadata past the head is lost.
const MAX_EXIF_FULL_READ_SIZE = 100 * 1024 * 1024;
const EXIF_HEAD_SIZE = 1024 * 1024;

export const getExifInfo = async (file: File, mimeType: string): Promise<ExpandedTags | undefined> => {
    if (!isImage(mimeType) || isSVG(mimeType)) {
        return undefined;
    }

    // ExifReader reads the rest of the file when it can't find the metadata in the head,
    // so large files are cut to their head first. Blob slices reference the file, they don't copy it.
    const source =
        file.size <= MAX_EXIF_FULL_READ_SIZE
            ? file
            : new File([file.slice(0, EXIF_HEAD_SIZE)], file.name, { type: file.type });

    try {
        return await ExifReader.load(source, {
            length: 'auto',
            expanded: true,
            includeOffsets: true,
            excludeTags: { mpf: true },
            domParser,
        });
    } catch {
        // Plain TIFF (most RAW formats) can't be read partially --> fall back to a full read of the source
    }

    const buffer = await source.arrayBuffer();

    try {
        return ExifReader.load(buffer, { expanded: true, domParser });
    } catch (err) {
        // If we can't read exif we can still continue

        console.warn('Cannot read exif data');
    }

    return undefined;
};

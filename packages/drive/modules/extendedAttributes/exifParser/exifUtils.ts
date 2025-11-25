import type { ExifTags, ExpandedTags } from 'exifreader';

import { formatExifDateTime } from './formatExifDateTime';

export const getFormattedDateTime = (exif?: ExifTags) => {
    if (!exif) {
        return undefined;
    }
    const sources = [exif.DateTimeOriginal, exif.DateTimeDigitized, exif.DateTime];
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (!source?.value?.[0]) {
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

export const getCaptureDateTime = (file: File, exif?: ExifTags) => {
    const formattedDateTime = getFormattedDateTime(exif);

    const captureDateTime = new Date(formattedDateTime || file.lastModified);

    return captureDateTime;
};

export const getPhotoDimensions = ({ exif, png }: ExpandedTags): { width?: number; height?: number } => {
    return {
        width: exif?.ImageWidth?.value || exif?.PixelXDimension?.value || png?.['Image Width']?.value,
        height: exif?.ImageLength?.value || exif?.PixelYDimension?.value || png?.['Image Height']?.value,
    };
};

export const getCaptureDateTimeString = (exif?: ExifTags) => {
    try {
        const formattedDateTime = getFormattedDateTime(exif);
        // Treat EXIF datetime as UTC by appending 'Z'
        return formattedDateTime ? new Date(`${formattedDateTime}Z`).toISOString() : undefined;
    } catch {
        return undefined;
    }
};

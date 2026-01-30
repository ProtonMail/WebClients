import type { ExifTags, ExpandedTags } from 'exifreader';

import { isValidDate } from '@proton/shared/lib/date/date';

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

    // NOTE: From specification (https://drive.gitlab-pages.protontech.ch/documentation/specifications/photos/upload/#revision-commit),
    // the fallback datetime should be the creation time. However in a browser
    // context, the File object has only the last modified time.
    const captureDateTime = new Date(formattedDateTime || file.lastModified);

    // Dates before the Unix epoch (1970) are not supported by the backend.
    if (!isValidDate(captureDateTime) || captureDateTime.getTime() < 0) {
        return new Date();
    }

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
        if (!formattedDateTime) {
            return undefined;
        }

        // Treat EXIF datetime as UTC by appending 'Z'
        const captureDateTime = new Date(`${formattedDateTime}Z`);

        if (captureDateTime.getTime() < 0) {
            return new Date().toISOString();
        }

        return captureDateTime.toISOString();
    } catch {
        return undefined;
    }
};

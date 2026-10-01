import type { ExifTags, ExpandedTags } from 'exifreader';

import { isValidDate } from '@proton/shared/lib/date/date';

import { formatExifDateTime } from './formatExifDateTime';

const EXIF_OFFSET_REGEX = /^[+-]\d{2}:\d{2}$/;

const getExifDateTime = (exif?: ExifTags) => {
    if (!exif) {
        return undefined;
    }
    const sources = [
        [exif.DateTimeOriginal, exif.OffsetTimeOriginal],
        [exif.DateTimeDigitized, exif.OffsetTimeDigitized],
        [exif.DateTime, exif.OffsetTime],
    ];
    for (const [dateTimeTag, offsetTag] of sources) {
        if (!dateTimeTag?.value?.[0]) {
            continue;
        }
        try {
            const offset = offsetTag?.value?.[0];
            return {
                dateTime: formatExifDateTime(dateTimeTag.value[0]),
                offset: offset && EXIF_OFFSET_REGEX.test(offset) ? offset : undefined,
            };
        } catch {
            continue;
        }
    }
    return undefined;
};

export const getFormattedDateTime = (exif?: ExifTags) => getExifDateTime(exif)?.dateTime;

export const getCaptureDateTime = (file: File, exif?: ExifTags, mp4CreationTime?: Date | null) => {
    const exifDateTime = getExifDateTime(exif);
    const isoDateTime = exifDateTime?.dateTime.replace(' ', 'T');
    // EXIF offset known --> exact UTC instant. Otherwise --> interpreted in the browser timezone.
    const formattedDateTime = exifDateTime?.offset ? `${isoDateTime}${exifDateTime.offset}` : isoDateTime;

    // NOTE: From specification (https://drive.gitlab-pages.protontech.ch/documentation/specifications/photos/upload/#revision-commit),
    // the fallback datetime should be the creation time. However in a browser
    // context, the File object has only the last modified time. For videos,
    // `mp4CreationTime` (read from the MP4 `mvhd` box) is preferred over that,
    // since `lastModified` reflects when the file was last touched on disk
    // (e.g. a Google Takeout export), not when it was recorded.
    const captureDateTime = new Date(formattedDateTime || mp4CreationTime || file.lastModified);

    if (!isValidDate(captureDateTime)) {
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
        const exifDateTime = getExifDateTime(exif);
        if (!exifDateTime) {
            return undefined;
        }

        // EXIF offset known --> camera wall-clock time with the offset (eg. 18:22:16+02:00).
        // Otherwise --> real UTC instant, interpreted in the browser timezone like Photo.CaptureTime (eg. 16:22:16Z).
        // NOTE: Until September 2026, web wrongly wrote the camera wall-clock time with 'Z' (eg. 18:22:16Z).
        const localDateTime = exifDateTime.dateTime.replace(' ', 'T');
        const captureDateTime = exifDateTime.offset ? new Date(`${localDateTime}Z`) : new Date(localDateTime);

        if (!isValidDate(captureDateTime)) {
            return new Date().toISOString();
        }

        const isoDateTime = captureDateTime.toISOString();
        return exifDateTime.offset ? isoDateTime.replace(/Z$/, exifDateTime.offset) : isoDateTime;
    } catch {
        return undefined;
    }
};

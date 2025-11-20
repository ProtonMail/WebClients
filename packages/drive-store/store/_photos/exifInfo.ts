import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom';
import ExifReader from 'exifreader';
import type { ExifTags, ExpandedTags } from 'exifreader';

import { getFileExtension, isRAWExtension, isRAWPhoto, isSVG, isVideo } from '@proton/shared/lib/helpers/mimetype';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { mimetypeFromExtension } from '../_uploads/mimeTypeParser/helpers';
import { detectPortraitFromMakerNote, detectSelfieFromMakerNote, isAppleMakerNote } from './appleMakerNote';
import { convertSubjectAreaToSubjectCoordinates, formatExifDateTime } from './utils';

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

export const getExifInfo = async (file: File, mimeType: string): Promise<ExpandedTags | undefined> => {
    // Skip EXIF extraction for videos to avoid reading large files into memory
    // Videos don't typically contain useful EXIF data, and reading large video files
    // can cause NotReadableError in Chromium browsers
    // SVG doesn't have any EXIF info as well
    if (isSVG(mimeType) || isVideo(mimeType)) {
        return undefined;
    }

    const buffer = await file.arrayBuffer();

    try {
        return ExifReader.load(buffer, { expanded: true });
    } catch (err) {}

    return undefined;
};

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

export const getCaptureDateTime = (file: File, exif?: ExifTags) => {
    const formattedDateTime = getFormattedDateTime(exif);

    // If file.lastModified is not know, current date will be returned:
    // https://developer.mozilla.org/en-US/docs/Web/API/File/lastModified
    const captureDateTime = new Date(formattedDateTime || file.lastModified);

    return captureDateTime;
};

export const getPhotoDimensions = ({ exif, png }: ExpandedTags): { width?: number; height?: number } => ({
    width: exif?.ImageWidth?.value || exif?.PixelXDimension?.value || png?.['Image Width']?.value,
    height: exif?.ImageLength?.value || exif?.PixelYDimension?.value || png?.['Image Height']?.value,
});

export const getCaptureDateTimeString = (exif?: ExifTags) => {
    try {
        const formattedDateTime = getFormattedDateTime(exif);
        return formattedDateTime ? new Date(formattedDateTime).toISOString() : undefined;
    } catch {
        return undefined;
    }
};

export const getPhotoExtendedAttributes = ({ exif, gps }: ExpandedTags) => ({
    location:
        gps?.Latitude && gps?.Longitude
            ? {
                  latitude: gps.Latitude,
                  longitude: gps.Longitude,
              }
            : undefined,
    camera: exif
        ? {
              device: exif.Model?.value[0],
              orientation: exif.Orientation?.value,
              captureTime: getCaptureDateTimeString(exif),
              subjectCoordinates: exif.SubjectArea?.value
                  ? convertSubjectAreaToSubjectCoordinates(exif.SubjectArea.value)
                  : undefined,
          }
        : undefined,
});

// TODO: Complete tags assignment
export const getPhotoTags = async (file: File, exifInfo?: ExpandedTags): Promise<PhotoTag[]> => {
    // Enable to debug XMP data:
    // console.log('exifInfo', JSON.stringify(exifInfo.exif));

    const tags: PhotoTag[] = [];

    const extension = getFileExtension(file.name);
    if (isRAWPhoto(file.type) || isRAWExtension(extension)) {
        tags.push(PhotoTag.Raw);
    }

    if (isVideo(file.type) || isVideo(await mimetypeFromExtension(file.name))) {
        tags.push(PhotoTag.Videos);
    }

    if (!exifInfo || !exifInfo.xmp) {
        return tags;
    }

    const appleMakerNote = isAppleMakerNote(exifInfo.exif?.MakerNote);

    // Tested:
    // MacOS screenshots and IOS screenshots is inside XMP metadata
    // Android, Linux and Windows it's just within the file name, no metadata available to detect screenshot
    if (
        (exifInfo.xmp.UserComment && exifInfo.xmp.UserComment.value === 'Screenshot') ||
        file.name.toLowerCase().includes('screenshot')
    ) {
        tags.push(PhotoTag.Screenshots);
    }

    // Tested: Android
    // Untested: IOS & other cameras
    if (exifInfo.xmp.ProjectionType && exifInfo.xmp.ProjectionType.value === 'equirectangular') {
        tags.push(PhotoTag.Panoramas);
    }

    // Tested: Android
    // Untested: IOS & other cameras
    if (exifInfo.xmp.MotionPhoto && exifInfo.xmp.MotionPhoto.value === '1') {
        tags.push(PhotoTag.MotionPhotos);
    }

    // Tested: Android
    // Untested: IOS
    const isAndroidPortrait =
        exifInfo.xmp.SpecialTypeID &&
        exifInfo.xmp.SpecialTypeID.value &&
        (exifInfo.xmp.SpecialTypeID.value ===
            'com.google.android.apps.camera.gallery.specialtype.SpecialType-PORTRAIT' ||
            (Array.isArray(exifInfo.xmp.SpecialTypeID.value) &&
                exifInfo.xmp.SpecialTypeID.value.some(
                    (v) => v.value === 'com.google.android.apps.camera.gallery.specialtype.SpecialType-PORTRAIT'
                )));

    if (isAndroidPortrait || (appleMakerNote && detectPortraitFromMakerNote(appleMakerNote))) {
        tags.push(PhotoTag.Portraits);
    }

    // Tested: IOS Selfies
    // Untested: Android Selfies
    if (appleMakerNote && detectSelfieFromMakerNote(appleMakerNote)) {
        tags.push(PhotoTag.Selfies);
    }

    return tags;
};

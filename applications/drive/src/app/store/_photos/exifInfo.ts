import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom';
import ExifReader from 'exifreader';
import type { ExifTags, ExpandedTags } from 'exifreader';

import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { encodeBase64 } from '@proton/crypto/lib/utils';
import { isRAWExtension, isRAWPhoto, isSVG, isVideo } from '@proton/shared/lib/helpers/mimetype';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { mimetypeFromExtension } from '../_uploads/mimeTypeParser/helpers';
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
    if (isSVG(mimeType)) {
        return undefined;
    }

    const buffer = await file.arrayBuffer();

    try {
        return ExifReader.load(buffer, { expanded: true });
    } catch (err) {}

    return undefined;
};

export async function encryptExifInfo(
    exifInfo: ExpandedTags,
    nodePrivateKey: PrivateKeyReference,
    addressPrivateKey: PrivateKeyReference
) {
    const exifInfoString = JSON.stringify(exifInfo);
    const { message } = await CryptoProxy.encryptMessage({
        textData: exifInfoString,
        encryptionKeys: nodePrivateKey,
        signingKeys: addressPrivateKey,
        compress: true,
        signatureContext: { value: 'drive.photo.exif', critical: true },
    });
    return encodeBase64(message);
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

// TODO: Complete tags assignment for IOS and Windows
export const getPhotoTags = async (file: File, exifInfo: ExpandedTags): Promise<PhotoTag[]> => {
    // Enable to debug XMP data: console.log('exifInfo', JSON.stringify(exifInfo.xmp));

    const tags: PhotoTag[] = [];
    if (!exifInfo || !exifInfo.xmp) {
        return tags;
    }

    // Tested: MacOS screenshots and IOS screenshots
    // Untested: Windows screenshots, Linux screenshots, Android screenshots
    if (exifInfo.xmp.UserComment && exifInfo.xmp.UserComment.value === 'Screenshot') {
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
    // Untested: IOS & other cameras
    if (
        exifInfo.xmp.SpecialTypeID &&
        exifInfo.xmp.SpecialTypeID.value &&
        (exifInfo.xmp.SpecialTypeID.value ===
            'com.google.android.apps.camera.gallery.specialtype.SpecialType-PORTRAIT' ||
            (Array.isArray(exifInfo.xmp.SpecialTypeID.value) &&
                exifInfo.xmp.SpecialTypeID.value.some(
                    (v) => v.value === 'com.google.android.apps.camera.gallery.specialtype.SpecialType-PORTRAIT'
                )))
    ) {
        tags.push(PhotoTag.Portraits);
    }

    const extension = file.name.split('.').pop();
    if (isRAWPhoto(file.type) || isRAWExtension(extension)) {
        tags.push(PhotoTag.Raw);
    }

    if (isVideo(file.type) || isVideo(await mimetypeFromExtension(file.name))) {
        tags.push(PhotoTag.Videos);
    }

    return tags;
};

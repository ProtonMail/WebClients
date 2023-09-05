import ExifReader from 'exifreader';
import type { ExifTags, ExpandedTags } from 'exifreader';

import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { encodeBase64 } from '@proton/crypto/lib/utils';
import { isSVG } from '@proton/shared/lib/helpers/mimetype';

import { convertSubjectAreaToSubjectCoordinates, formatExifDateTime } from './utils';

export const getExifInfo = async (file: File, mimeType: string): Promise<ExpandedTags | undefined> => {
    if (isSVG(mimeType)) {
        return undefined;
    }
    await file.arrayBuffer().then((buffer) => {
        // In case of error with return empty exif
        try {
            return ExifReader.load(buffer, { expanded: true });
        } catch (err) {
            return undefined;
        }
    });
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
        context: { value: 'drive.photo.exif', critical: true },
    });
    return encodeBase64(message);
}

export const getCaptureDateTime = (file: File, exif?: ExifTags) => {
    const formattedDateTime = exif?.DateTime?.value[0] ? formatExifDateTime(exif?.DateTime?.value[0]) : undefined;

    // If file.lastModified is not know, current date will be returned:
    // https://developer.mozilla.org/en-US/docs/Web/API/File/lastModified
    const captureDateTime = new Date(formattedDateTime || file.lastModified);

    return captureDateTime;
};

export const getPhotoDimensions = ({ exif, png }: ExpandedTags): { width?: number; height?: number } => ({
    width: exif?.ImageWidth?.value || exif?.PixelXDimension?.value || png?.['Image Width']?.value,
    height: exif?.ImageLength?.value || exif?.PixelYDimension?.value || png?.['Image Height']?.value,
});

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
              captureTime: exif?.DateTime?.value[0]
                  ? new Date(formatExifDateTime(exif?.DateTime?.value[0])).toISOString()
                  : undefined,
              subjectCoordinates: exif.SubjectArea?.value
                  ? convertSubjectAreaToSubjectCoordinates(exif.SubjectArea.value)
                  : undefined,
          }
        : undefined,
});

import type { ExpandedTags } from 'exifreader';

import { convertSubjectAreaToSubjectCoordinates } from '../exifParser/convertSubjectAreaToSubjectCoordinates';
import { getCaptureDateTimeString, getPhotoDimensions } from '../exifParser/exifUtils';
import type { ExtendedAttributesMetadata, MediaInfo } from '../types';

const getPhotoExtendedAttributes = ({ exif, gps }: ExpandedTags) => {
    return {
        Location:
            gps?.Latitude && gps?.Longitude
                ? {
                      Latitude: gps.Latitude,
                      Longitude: gps.Longitude,
                  }
                : undefined,
        Camera: exif
            ? {
                  ...(exif.Model?.value[0] && { Device: exif.Model.value[0] }),
                  ...(exif.Orientation?.value !== undefined && { Orientation: exif.Orientation.value }),
                  ...(getCaptureDateTimeString(exif) && { CaptureTime: getCaptureDateTimeString(exif) }),
                  ...(exif.SubjectArea?.value && {
                      SubjectCoordinates: convertSubjectAreaToSubjectCoordinates(exif.SubjectArea.value),
                  }),
              }
            : undefined,
    };
};

export const buildExtendedAttributesMetadata = (
    exifInfo: ExpandedTags | undefined,
    mediaInfo?: MediaInfo
): ExtendedAttributesMetadata => {
    const { width, height } = exifInfo
        ? getPhotoDimensions(exifInfo)
        : {
              width: mediaInfo?.width,
              height: mediaInfo?.height,
          };

    const photosExtendedAttributes = exifInfo ? getPhotoExtendedAttributes(exifInfo) : undefined;

    return {
        Media: {
            Width: width,
            Height: height,
            Duration: mediaInfo?.duration,
        },
        Location: photosExtendedAttributes?.Location,
        Camera: photosExtendedAttributes?.Camera,
    };
};

import type { ExpandedTags } from 'exifreader';

import { getFileExtension, isRAWExtension, isRAWPhoto, isVideo } from '@proton/shared/lib/helpers/mimetype';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { detectPortraitFromMakerNote, detectSelfieFromMakerNote, isAppleMakerNote } from '../exifParser/appleMakerNote';

export const getPhotoTags = async (file: File, mimeType: string, exifInfo?: ExpandedTags): Promise<PhotoTag[]> => {
    const tags: PhotoTag[] = [];

    const extension = getFileExtension(file.name);
    if (isRAWPhoto(mimeType) || isRAWExtension(extension)) {
        tags.push(PhotoTag.Raw);
    }

    if (isVideo(mimeType)) {
        tags.push(PhotoTag.Videos);
    }

    if (!exifInfo || !exifInfo.xmp) {
        return tags;
    }

    const appleMakerNote = isAppleMakerNote(exifInfo.exif?.MakerNote);

    if (
        (exifInfo.xmp.UserComment && exifInfo.xmp.UserComment.value === 'Screenshot') ||
        file.name.toLowerCase().includes('screenshot')
    ) {
        tags.push(PhotoTag.Screenshots);
    }

    if (exifInfo.xmp.ProjectionType && exifInfo.xmp.ProjectionType.value === 'equirectangular') {
        tags.push(PhotoTag.Panoramas);
    }

    if (exifInfo.xmp.MotionPhoto && exifInfo.xmp.MotionPhoto.value === '1') {
        tags.push(PhotoTag.MotionPhotos);
    }

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

    if (appleMakerNote && detectSelfieFromMakerNote(appleMakerNote)) {
        tags.push(PhotoTag.Selfies);
    }

    return tags;
};

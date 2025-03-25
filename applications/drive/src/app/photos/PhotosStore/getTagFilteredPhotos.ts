import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { type PhotoGridItem, isPhotoGroup } from '../../store';

/**
 * Filters photos based on selected tags and ensures photo groups are properly maintained
 *
 * This function performs a two-step filtering process:
 * 1. It first filters photos that match any of the selected tags (or keeps all photos if PhotoTag.All is selected)
 * 2. It then ensures photo groups are only kept if they immediately precede a filtered photo (remove if last or if next index is photo group)
 *
 * @param photos The list of photos to filter
 * @param selectedTags The currently selected tags
 * @returns Filtered photos with maintained group structure
 */
export const getTagFilteredPhotos = (photos: PhotoGridItem[], selectedTags: PhotoTag[]): PhotoGridItem[] => {
    const filteredPhotosWithGroup = photos.filter(
        (photo) =>
            isPhotoGroup(photo) ||
            selectedTags.includes(PhotoTag.All) ||
            selectedTags.find((tag) => photo.photoProperties?.tags.includes(tag)) !== undefined
    );

    return filteredPhotosWithGroup.filter(
        (photo, index) =>
            !isPhotoGroup(photo) ||
            (isPhotoGroup(photo) &&
                filteredPhotosWithGroup[index + 1] !== undefined &&
                !isPhotoGroup(filteredPhotosWithGroup[index + 1]))
    );
};

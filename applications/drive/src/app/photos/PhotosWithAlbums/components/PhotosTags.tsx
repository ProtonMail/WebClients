import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { ButtonGroup, Icon, type IconName } from '@proton/components/index';

import { PhotoTags } from '../../../store';

export interface PhotosTagsProps {
    selectedTag: (PhotoTags | 'all')[];
    tags: PhotoTags[];
    onTagSelect: (tag: (PhotoTags | 'all')[]) => void;
}

const getTagLabelWithIcon = (
    tag: PhotoTags
): {
    label: string;
    iconName: IconName;
} => {
    switch (tag) {
        case PhotoTags.Favorites:
            return {
                label: c('Tag').t`Favorites`,
                iconName: 'heart',
            };
        case PhotoTags.Screenshots:
            return {
                label: c('Tag').t`Screenshots`,
                iconName: 'screenshot',
            };
        case PhotoTags.Videos:
            return {
                label: c('Tag').t`Videos`,
                iconName: 'video-camera',
            };
        case PhotoTags.LivePhotos:
        case PhotoTags.MotionPhotos:
            return {
                label: c('Tag').t`Live Photos`,
                iconName: 'live',
            };

        case PhotoTags.Selfies:
            return {
                label: c('Tag').t`Selfies`,
                iconName: 'user',
            };
        case PhotoTags.Portraits:
            return {
                label: c('Tag').t`Portraits`,
                iconName: 'user-circle',
            };
        case PhotoTags.Bursts:
            return {
                label: c('Tag').t`Bursts`,
                iconName: 'image-stacked',
            };
        case PhotoTags.Panoramas:
            return {
                label: c('Tag').t`Panoramas`,
                iconName: 'panorama',
            };
        case PhotoTags.Raw:
            return {
                label: c('Tag').t`RAW`,
                iconName: 'raw',
            };
    }
};

export const PhotosTags = ({ selectedTag, tags, onTagSelect }: PhotosTagsProps) => {
    // Live and Motion are combined
    const includeBothMotions = tags.includes(PhotoTags.LivePhotos) && tags.includes(PhotoTags.MotionPhotos);
    const filteredTags = includeBothMotions ? tags.filter((tag) => tag !== PhotoTags.MotionPhotos) : tags;

    const handleTagSelect = (tag: PhotoTags) => {
        if (tag === PhotoTags.LivePhotos || tag === PhotoTags.MotionPhotos) {
            onTagSelect([PhotoTags.LivePhotos, PhotoTags.MotionPhotos]);
        } else {
            onTagSelect([tag]);
        }
    };

    return (
        <ButtonGroup>
            {/* translator: All is for all tags selection */}
            <Button selected={selectedTag.includes('all')} onClick={() => onTagSelect(['all'])}>{c('Label')
                .t`All`}</Button>
            {filteredTags.map((tag) => {
                const { iconName, label } = getTagLabelWithIcon(tag);

                return (
                    <Button
                        selected={selectedTag.includes(tag)}
                        key={tag}
                        className="flex items-center"
                        onClick={() => handleTagSelect(tag)}
                    >
                        <Icon className="mr-1" name={iconName} />
                        <span>{label}</span>
                    </Button>
                );
            })}
        </ButtonGroup>
    );
};

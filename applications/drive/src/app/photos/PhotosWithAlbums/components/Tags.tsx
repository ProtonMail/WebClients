import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { ButtonGroup, Icon, type IconName } from '@proton/components/index';

import { AlbumTag, PhotoTag, type Tag } from '../../../store';

export interface TagsProps<T extends Tag> {
    selectedTag: T[];
    tags: T[];
    onTagSelect: (tag: T[]) => void;
}

export type PhotosTagsProps = TagsProps<PhotoTag>;
export type AlbumsTagsProps = TagsProps<AlbumTag>;

const getTagLabelWithIcon = (
    tag: Tag
): {
    label: string;
    iconName: IconName;
} => {
    if (Object.values(PhotoTag).includes(tag as PhotoTag)) {
        const photoTag = tag as PhotoTag;
        switch (photoTag) {
            case PhotoTag.Favorites:
                return {
                    label: c('Tag').t`Favorites`,
                    iconName: 'heart',
                };
            case PhotoTag.Screenshots:
                return {
                    label: c('Tag').t`Screenshots`,
                    iconName: 'screenshot',
                };
            case PhotoTag.Videos:
                return {
                    label: c('Tag').t`Videos`,
                    iconName: 'video-camera',
                };
            case PhotoTag.LivePhotos:
            case PhotoTag.MotionPhotos:
                return {
                    label: c('Tag').t`Live Photos`,
                    iconName: 'live',
                };
            case PhotoTag.Selfies:
                return {
                    label: c('Tag').t`Selfies`,
                    iconName: 'user',
                };
            case PhotoTag.Portraits:
                return {
                    label: c('Tag').t`Portraits`,
                    iconName: 'user-circle',
                };
            case PhotoTag.Bursts:
                return {
                    label: c('Tag').t`Bursts`,
                    iconName: 'image-stacked',
                };
            case PhotoTag.Panoramas:
                return {
                    label: c('Tag').t`Panoramas`,
                    iconName: 'panorama',
                };
            case PhotoTag.Raw:
                return {
                    label: c('Tag').t`RAW`,
                    iconName: 'raw',
                };
            case PhotoTag.All:
                return {
                    label: c('Label').t`All`,
                    iconName: 'checkmark',
                };
        }
    }

    const albumTag = tag as AlbumTag;
    switch (albumTag) {
        case AlbumTag.All:
            return {
                label: c('Label').t`All`,
                iconName: 'checkmark',
            };
        case AlbumTag.MyAlbums:
            return {
                label: c('Label').t`My Albums`,
                iconName: 'heart',
            };
        case AlbumTag.Shared:
            return {
                label: c('Label').t`Shared`,
                iconName: 'link',
            };
        case AlbumTag.SharedWithMe:
            return {
                label: c('Label').t`Shared with me`,
                iconName: 'users',
            };
    }

    throw new Error(`Unhandled tag type: ${tag}`);
};

function Tags<T extends Tag>({ selectedTag, tags, onTagSelect }: TagsProps<T>) {
    return (
        <ButtonGroup>
            {tags.map((tag) => {
                const { iconName, label } = getTagLabelWithIcon(tag);
                return (
                    <Button
                        selected={selectedTag.includes(tag)}
                        key={tag}
                        className="flex items-center"
                        onClick={() => onTagSelect([tag])}
                    >
                        <Icon className="mr-1" name={iconName} />
                        <span>{label}</span>
                    </Button>
                );
            })}
        </ButtonGroup>
    );
}

export const PhotosTags = ({ selectedTag, tags, onTagSelect }: PhotosTagsProps) => {
    // Live and Motion are combined
    const includeBothMotions = tags.includes(PhotoTag.LivePhotos) && tags.includes(PhotoTag.MotionPhotos);
    const filteredTags = includeBothMotions ? tags.filter((tag) => tag !== PhotoTag.MotionPhotos) : tags;

    const handleTagSelect = (tag: PhotoTag[]) => {
        const selectedTagValue = tag[0];
        if (selectedTagValue === PhotoTag.LivePhotos || selectedTagValue === PhotoTag.MotionPhotos) {
            onTagSelect([PhotoTag.LivePhotos, PhotoTag.MotionPhotos]);
        } else {
            onTagSelect(tag);
        }
    };

    return <Tags<PhotoTag> selectedTag={selectedTag} tags={filteredTags} onTagSelect={handleTagSelect} />;
};

export const AlbumsTags = ({ selectedTag, tags, onTagSelect }: AlbumsTagsProps) => {
    return <Tags<AlbumTag> selectedTag={selectedTag} tags={tags} onTagSelect={onTagSelect} />;
};

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { UncontainedWrapper } from '@proton/components';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcHeart } from '@proton/icons/icons/IcHeart';
import { IcImageStacked } from '@proton/icons/icons/IcImageStacked';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcLive } from '@proton/icons/icons/IcLive';
import { IcPanorama } from '@proton/icons/icons/IcPanorama';
import { IcRaw } from '@proton/icons/icons/IcRaw';
import { IcScreenshot } from '@proton/icons/icons/IcScreenshot';
import { IcUser } from '@proton/icons/icons/IcUser';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { IcVideoCamera } from '@proton/icons/icons/IcVideoCamera';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import clsx from '@proton/utils/clsx';

import { AlbumTag, type Tag } from '../../../store';

export interface TagsProps<T extends Tag> {
    selectedTags: T[];
    tags: T[];
    onTagSelect: (tag: T[]) => void;
}

export type PhotosTagsProps = TagsProps<PhotoTag>;
export type AlbumsTagsProps = TagsProps<AlbumTag>;

const getTagLabelWithIcon = (
    tag: Tag
): {
    label: string;
    icon: React.ReactNode;
} => {
    if (Object.values(PhotoTag).includes(tag as PhotoTag)) {
        const photoTag = tag as PhotoTag;
        switch (photoTag) {
            case PhotoTag.Favorites:
                return {
                    label: c('Tag').t`Favorites`,
                    icon: <IcHeart className="shrink-0" />,
                };
            case PhotoTag.Screenshots:
                return {
                    label: c('Tag').t`Screenshots`,
                    icon: <IcScreenshot className="shrink-0" />,
                };
            case PhotoTag.Videos:
                return {
                    label: c('Tag').t`Videos`,
                    icon: <IcVideoCamera className="shrink-0" />,
                };
            case PhotoTag.LivePhotos:
            case PhotoTag.MotionPhotos:
                return {
                    label: c('Tag').t`Live Photos`,
                    icon: <IcLive className="shrink-0" />,
                };
            case PhotoTag.Selfies:
                return {
                    label: c('Tag').t`Selfies`,
                    icon: <IcUser className="shrink-0" />,
                };
            case PhotoTag.Portraits:
                return {
                    label: c('Tag').t`Portraits`,
                    icon: <IcUserCircle className="shrink-0" />,
                };
            case PhotoTag.Bursts:
                return {
                    label: c('Tag').t`Bursts`,
                    icon: <IcImageStacked className="shrink-0" />,
                };
            case PhotoTag.Panoramas:
                return {
                    label: c('Tag').t`Panoramas`,
                    icon: <IcPanorama className="shrink-0" />,
                };
            case PhotoTag.Raw:
                return {
                    label: c('Tag').t`RAW`,
                    icon: <IcRaw className="shrink-0" />,
                };
            case PhotoTag.All:
                return {
                    label: c('Label').t`All`,
                    icon: <IcCheckmark className="shrink-0" />,
                };
        }
    }

    const albumTag = tag as AlbumTag;
    switch (albumTag) {
        case AlbumTag.All:
            return {
                label: c('Label').t`All`,
                icon: <IcCheckmark className="shrink-0" />,
            };
        case AlbumTag.MyAlbums:
            return {
                label: c('Label').t`My Albums`,
                icon: <IcUser className="shrink-0" />,
            };
        case AlbumTag.Shared:
            return {
                label: c('Label').t`Shared`,
                icon: <IcLink className="shrink-0" />,
            };
        case AlbumTag.SharedWithMe:
            return {
                label: c('Label').t`Shared with me`,
                icon: <IcUsers className="shrink-0" />,
            };
        default:
            throw new Error(`Unhandled tag type: ${tag}`);
    }
};

function Tags<T extends Tag>({ selectedTags, tags, onTagSelect }: TagsProps<T>) {
    return (
        <UncontainedWrapper
            className="mx-4 min-h-custom"
            style={{
                '--min-h-custom': 'auto',
            }}
            innerClassName="flex flex-nowrap items-center gap-1 py-0.5 pl-0.5"
        >
            {tags.map((tag) => {
                const { icon, label } = getTagLabelWithIcon(tag);
                const selected = selectedTags.includes(tag);
                return (
                    <Button
                        shape="ghost"
                        aria-pressed={selected}
                        key={tag}
                        className={clsx(
                            'inline-flex gap-2 items-center flex-nowrap text-semibold',
                            selected ? 'is-active' : 'color-weak'
                        )}
                        onClick={() => onTagSelect([tag])}
                    >
                        {icon}
                        <span>{label}</span>
                    </Button>
                );
            })}
        </UncontainedWrapper>
    );
}

export const PhotosTags = ({ selectedTags, tags, onTagSelect }: PhotosTagsProps) => {
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

    return <Tags<PhotoTag> selectedTags={selectedTags} tags={filteredTags} onTagSelect={handleTagSelect} />;
};

export const AlbumsTags = ({ selectedTags, tags, onTagSelect }: AlbumsTagsProps) => {
    return <Tags<AlbumTag> selectedTags={selectedTags} tags={tags} onTagSelect={onTagSelect} />;
};

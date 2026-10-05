import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Loader, UncontainedWrapper } from '@proton/components';
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

import { AlbumTag, type Tag } from '../../../legacy/store';

interface TagsProps<T extends Tag> {
    selectedTags: T[];
    tags: T[];
    onTagSelect: (tag: T[]) => void;
    counts?: Partial<Record<T, number>>;
    loading?: boolean;
}

type IconComponent = typeof IcCheckmark;

export type PhotosTagsProps = TagsProps<PhotoTag>;
export type AlbumsTagsProps = TagsProps<AlbumTag>;

const getTagLabelWithIcon = (
    tag: Tag
): {
    label: string;
    icon: IconComponent;
} => {
    if (Object.values(PhotoTag).includes(tag as PhotoTag)) {
        const photoTag = tag as PhotoTag;
        switch (photoTag) {
            case PhotoTag.Favorites:
                return {
                    label: c('Tag').t`Favorites`,
                    icon: IcHeart,
                };
            case PhotoTag.Screenshots:
                return {
                    label: c('Tag').t`Screenshots`,
                    icon: IcScreenshot,
                };
            case PhotoTag.Videos:
                return {
                    label: c('Tag').t`Videos`,
                    icon: IcVideoCamera,
                };
            case PhotoTag.LivePhotos:
            case PhotoTag.MotionPhotos:
                return {
                    label: c('Tag').t`Live Photos`,
                    icon: IcLive,
                };
            case PhotoTag.Selfies:
                return {
                    label: c('Tag').t`Selfies`,
                    icon: IcUser,
                };
            case PhotoTag.Portraits:
                return {
                    label: c('Tag').t`Portraits`,
                    icon: IcUserCircle,
                };
            case PhotoTag.Bursts:
                return {
                    label: c('Tag').t`Bursts`,
                    icon: IcImageStacked,
                };
            case PhotoTag.Panoramas:
                return {
                    label: c('Tag').t`Panoramas`,
                    icon: IcPanorama,
                };
            case PhotoTag.Raw:
                return {
                    label: c('Tag').t`RAW`,
                    icon: IcRaw,
                };
            case PhotoTag.All:
                return {
                    label: c('Label').t`All`,
                    icon: IcCheckmark,
                };
        }
    }

    const albumTag = tag as AlbumTag;
    switch (albumTag) {
        case AlbumTag.All:
            return {
                label: c('Label').t`All`,
                icon: IcCheckmark,
            };
        case AlbumTag.MyAlbums:
            return {
                label: c('Label').t`My Albums`,
                icon: IcUser,
            };
        case AlbumTag.Shared:
            return {
                label: c('Label').t`Shared`,
                icon: IcLink,
            };
        case AlbumTag.SharedWithMe:
            return {
                label: c('Label').t`Shared with me`,
                icon: IcUsers,
            };
        default:
            throw new Error(`Unhandled tag type: ${tag}`);
    }
};

function Tags<T extends Tag>({ selectedTags, tags, onTagSelect, counts, loading }: TagsProps<T>) {
    return (
        <UncontainedWrapper
            className="min-h-custom mx-4"
            style={{
                '--min-h-custom': 'auto',
            }}
            innerClassName="flex flex-nowrap items-center gap-1 py-0.5 pl-0.5"
        >
            {tags.map((tag) => {
                const { icon: Icon, label } = getTagLabelWithIcon(tag);
                const selected = selectedTags.includes(tag);
                const count = counts?.[tag];
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
                        <Icon className="shrink-0" />
                        {loading ? (
                            <span className="inline-flex gap-2 items-center">
                                {label}
                                <Loader className="mx-0" />
                            </span>
                        ) : (
                            <span>{count !== undefined ? `${label} (${count})` : label}</span>
                        )}
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

    return <Tags selectedTags={selectedTags} tags={filteredTags} onTagSelect={handleTagSelect} />;
};

export const AlbumsTags = ({ selectedTags, tags, onTagSelect, counts, loading }: AlbumsTagsProps) => {
    return <Tags selectedTags={selectedTags} tags={tags} onTagSelect={onTagSelect} counts={counts} loading={loading} />;
};

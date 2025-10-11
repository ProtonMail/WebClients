import type { IconName } from 'packages/icons/types';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import clsx from '@proton/utils/clsx';

import { AlbumTag, type Tag } from '../../store';

const getTagLabelsWithIcon = (
    tag: Tag
): {
    title: string;
    subtitle: string;
    iconName: IconName;
} => {
    switch (tag) {
        case PhotoTag.Favorites:
            return {
                title: c('Title').t`No favorites`,
                subtitle: c('Subtitle').t`Your favorited photos will appear here`,
                iconName: 'heart',
            };
        case PhotoTag.Screenshots:
            return {
                title: c('Title').t`No screenshots`,
                subtitle: c('Subtitle').t`Your screenshots will appear here`,
                iconName: 'screenshot',
            };
        case PhotoTag.Videos:
            return {
                title: c('Title').t`No videos`,
                subtitle: c('Subtitle').t`Your videos will appear here`,
                iconName: 'video-camera',
            };
        case PhotoTag.LivePhotos:
        case PhotoTag.MotionPhotos:
            return {
                title: c('Title').t`No Live Photos`,
                subtitle: c('Subtitle').t`Your Live Photos will appear here`,
                iconName: 'live',
            };
        case PhotoTag.Selfies:
            return {
                title: c('Title').t`No selfies`,
                subtitle: c('Subtitle').t`Your selfies photos will appear here`,
                iconName: 'user',
            };
        case PhotoTag.Portraits:
            return {
                title: c('Title').t`No portraits`,
                subtitle: c('Subtitle').t`Your portraits photos will appear here`,
                iconName: 'user-circle',
            };
        case PhotoTag.Bursts:
            return {
                title: c('Title').t`No bursts`,
                subtitle: c('Subtitle').t`Your photo bursts will appear here`,
                iconName: 'image-stacked',
            };
        case PhotoTag.Panoramas:
            return {
                title: c('Title').t`No panorama`,
                subtitle: c('Subtitle').t`Your panorama photos will appear here`,
                iconName: 'panorama',
            };
        case PhotoTag.Raw:
            return {
                title: c('Title').t`No RAW`,
                subtitle: c('Subtitle').t`Your RAW photos will appear here`,
                iconName: 'raw',
            };
        case AlbumTag.Shared:
            return {
                title: c('Title').t`No shared albums`,
                subtitle: c('Subtitle').t`Albums you've shared will appear here`,
                iconName: 'link',
            };
        case AlbumTag.SharedWithMe:
            return {
                title: c('Title').t`No albums shared with me`,
                subtitle: c('Subtitle').t`Albums shared with you will appear here`,
                iconName: 'users',
            };
        default:
            return {
                title: c('Title').t`No photos`,
                subtitle: c('Subtitle').t`Your tagged photos will appear here`,
                iconName: 'image',
            };
    }
};

export interface EmptyTagViewProps {
    tag: Tag;
}

export const EmptyTagView = ({ tag }: EmptyTagViewProps) => {
    const { iconName, title, subtitle } = getTagLabelsWithIcon(tag);
    return (
        <div className="m-auto flex flex-column items-center justify-center gap-2">
            <Icon
                className={clsx(tag === PhotoTag.Favorites ? 'color-danger' : 'color-weak')}
                name={iconName}
                size={15}
            />
            <h3 className="text-bold text-xxl">{title}</h3>
            <h4 className="text-lg">{subtitle}</h4>
        </div>
    );
};
